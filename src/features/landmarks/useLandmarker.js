import { useCallback, useEffect, useRef, useState } from "react";
import { loadEngine } from "./engine";
import { hasHands, slimResults, toLegacyResults } from "./landmarkMath";
import { HAND_CONNECTIONS, POSE_CONNECTIONS, drawConnections, drawPoints } from "../../utils/landmarkConnections";

/**
 * Camera + MediaPipe holistic landmarks, for the Collector and the Translator.
 *
 *   const lm = useLandmarker({ onFrame });
 *   <LandmarkerView lm={lm} />
 *   lm.start(); lm.stop();
 *
 * status: idle | camera | engine | running | error
 *   camera   asking for / opening the camera
 *   engine   downloading or starting the recognition engine
 *   running  frames are flowing; onFrame(frame, meta) is called for each new video frame
 * error: { code, message } with code one of
 *   camera-denied | camera-missing | camera-in-use | unsupported | engine-failed
 *
 * onFrame receives the slim payload the server expects ({leftHandLandmarks?, ...}) and
 * meta { timestamp, handsVisible }. The hook stops the camera and the loop on unmount.
 */

export function describeCameraError(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return {
      code: "camera-denied",
      message: "Camera access is blocked. Allow the camera for this site in your browser's address bar, then try again.",
    };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
    return { code: "camera-missing", message: "No camera was found. Connect a camera and try again." };
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return {
      code: "camera-in-use",
      message: "The camera is busy. Close other apps or tabs that are using it, then try again.",
    };
  }
  return {
    code: "unsupported",
    message: "This browser can't open the camera here. Use a recent Chrome, Edge, Firefox or Safari over https.",
  };
}

const ENGINE_ERROR = {
  code: "engine-failed",
  message: "The sign recognition engine couldn't load. Check your connection and try again.",
};

function drawFrame(canvas, video, results, { mirror = true } = {}) {
  if (!canvas) return;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (mirror) {
    // Selfie view; landmarks are already mirrored into the legacy convention.
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  drawConnections(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "rgba(255,255,255,0.3)", lineWidth: 1 });
  if (results.rightHandLandmarks) {
    drawConnections(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: "rgba(0,217,231,0.85)", lineWidth: 2 });
    drawPoints(ctx, results.rightHandLandmarks, { color: "white", fillColor: "rgb(0,217,231)", radius: 3 });
  }
  if (results.leftHandLandmarks) {
    drawConnections(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: "rgba(255,138,0,0.85)", lineWidth: 2 });
    drawPoints(ctx, results.leftHandLandmarks, { color: "white", fillColor: "rgb(255,138,0)", radius: 3 });
  }
}

const DEVICE_KEY = "tm_camera_device";

function savedDeviceId() {
  try {
    return localStorage.getItem(DEVICE_KEY) || null;
  } catch {
    return null;
  }
}

export default function useLandmarker({ onFrame, draw = true, width = 960, height = 540 } = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const runRef = useRef(0); // increments on every start/stop; stale async work checks it
  const lastTimeRef = useRef(-1);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const fpsRef = useRef({ count: 0, since: 0 });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [delegate, setDelegate] = useState(null);
  const [handsVisible, setHandsVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(savedDeviceId);
  const handsVisibleRef = useRef(false);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices?.enumerateDevices?.();
      setDevices((all || []).filter((d) => d.kind === "videoinput"));
    } catch {
      setDevices([]);
    }
  }, []);

  const releaseCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    lastTimeRef.current = -1;
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    releaseCamera();
    handsVisibleRef.current = false;
    setHandsVisible(false);
    setFps(0);
    setStatus("idle");
  }, [releaseCamera]);

  const start = useCallback(
    async (opts = {}) => {
      const run = ++runRef.current;
      releaseCamera();
      setError(null);
      setStatus("camera");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(describeCameraError(new Error("unsupported")));
        setStatus("error");
        return false;
      }

      const wanted = opts.deviceId ?? deviceId;
      const constraints = {
        audio: false,
        video: {
          width: { ideal: width },
          height: { ideal: height },
          ...(wanted ? { deviceId: { exact: wanted } } : { facingMode: "user" }),
        },
      };

      // Camera and engine load in parallel; the engine is cached after the first start.
      const enginePromise = loadEngine();
      let stream;
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          // A saved camera that is gone: fall back to the default one.
          if (wanted && (err?.name === "OverconstrainedError" || err?.name === "NotFoundError")) {
            stream = await navigator.mediaDevices.getUserMedia({ ...constraints, video: { ...constraints.video, deviceId: undefined, facingMode: "user" } });
          } else throw err;
        }
      } catch (err) {
        if (run !== runRef.current) return false;
        setError(describeCameraError(err));
        setStatus("error");
        return false;
      }
      if (run !== runRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      streamRef.current = stream;
      refreshDevices();
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        try {
          await video.play();
        } catch {
          // autoplay of a muted inline video is allowed; ignore odd rejections
        }
      }

      setStatus("engine");
      let engine;
      try {
        engine = await enginePromise;
      } catch (err) {
        console.error("Holistic landmarker failed to load", err);
        if (run !== runRef.current) return false;
        releaseCamera();
        setError(ENGINE_ERROR);
        setStatus("error");
        return false;
      }
      if (run !== runRef.current) return false;
      setDelegate(engine.delegate);
      setStatus("running");
      fpsRef.current = { count: 0, since: performance.now() };

      let consecutiveFailures = 0;
      const loop = () => {
        if (run !== runRef.current) return;
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0 && v.currentTime !== lastTimeRef.current) {
          lastTimeRef.current = v.currentTime;
          try {
            const now = performance.now();
            const legacy = toLegacyResults(engine.landmarker.detectForVideo(v, now));
            consecutiveFailures = 0;
            if (draw) drawFrame(canvasRef.current, v, legacy);
            const frame = slimResults(legacy);
            const visible = hasHands(frame);
            if (visible !== handsVisibleRef.current) {
              handsVisibleRef.current = visible;
              setHandsVisible(visible);
            }
            const f = fpsRef.current;
            f.count += 1;
            if (now - f.since >= 1000) {
              setFps(Math.round((f.count * 1000) / (now - f.since)));
              f.count = 0;
              f.since = now;
            }
            onFrameRef.current?.(frame, { timestamp: Date.now(), handsVisible: visible });
          } catch (err) {
            consecutiveFailures += 1;
            if (consecutiveFailures === 30) {
              console.error("Landmark detection keeps failing", err);
              releaseCamera();
              setError(ENGINE_ERROR);
              setStatus("error");
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return true;
    },
    [deviceId, draw, height, refreshDevices, releaseCamera, width]
  );

  const selectDevice = useCallback(
    (id) => {
      setDeviceId(id || null);
      try {
        if (id) localStorage.setItem(DEVICE_KEY, id);
        else localStorage.removeItem(DEVICE_KEY);
      } catch {
        // not persisted
      }
      if (streamRef.current) start({ deviceId: id || null });
    },
    [start]
  );

  useEffect(() => {
    refreshDevices();
    const md = navigator.mediaDevices;
    md?.addEventListener?.("devicechange", refreshDevices);
    return () => md?.removeEventListener?.("devicechange", refreshDevices);
  }, [refreshDevices]);

  // Always release the camera and stop the loop when the page goes away.
  useEffect(
    () => () => {
      runRef.current += 1;
      releaseCamera();
    },
    [releaseCamera]
  );

  return {
    videoRef,
    canvasRef,
    status,
    error,
    delegate,
    handsVisible,
    fps,
    devices,
    deviceId,
    selectDevice,
    start,
    stop,
    isActive: status === "camera" || status === "engine" || status === "running",
  };
}
