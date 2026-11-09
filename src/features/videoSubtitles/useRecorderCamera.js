import { useCallback, useEffect, useRef, useState } from "react";
import { describeCameraError } from "../landmarks/useLandmarker";

const DEVICE_KEY = "tm_camera_device";

function savedDeviceId() {
  try {
    return localStorage.getItem(DEVICE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * The signer's camera for the Subtitle Designer: a MediaStream for MediaRecorder plus a preview.
 * Opt-in (nothing opens until start()), remembers the chosen camera, explains a blocked,
 * missing or busy camera, and always releases the camera on unmount.
 *
 * status: off | opening | on | error
 */
export default function useRecorderCamera({ width = 1280, height = 720 } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const runRef = useRef(0);
  const [status, setStatus] = useState("off");
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(savedDeviceId);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices?.enumerateDevices?.();
      setDevices((all || []).filter((d) => d.kind === "videoinput"));
    } catch {
      setDevices([]);
    }
  }, []);

  const release = useCallback(() => {
    const current = streamRef.current;
    streamRef.current = null;
    current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
  }, []);

  const attach = useCallback(async (s) => {
    const video = videoRef.current;
    if (!video || !s) return;
    video.srcObject = s;
    video.muted = true;
    video.playsInline = true;
    try {
      await video.play();
    } catch {
      // a muted inline preview may still be held back by the browser; the stream works anyway
    }
  }, []);

  const start = useCallback(
    async (opts = {}) => {
      const run = ++runRef.current;
      release();
      setError(null);
      setStatus("opening");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(describeCameraError(new Error("unsupported")));
        setStatus("error");
        return null;
      }
      const wanted = opts.deviceId ?? deviceId;
      const video = {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: 30 },
        ...(wanted ? { deviceId: { exact: wanted } } : { facingMode: "user" }),
      };
      let s;
      try {
        try {
          s = await navigator.mediaDevices.getUserMedia({ audio: false, video });
        } catch (err) {
          if (wanted && (err?.name === "OverconstrainedError" || err?.name === "NotFoundError")) {
            s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { ...video, deviceId: undefined, facingMode: "user" } });
          } else throw err;
        }
      } catch (err) {
        if (run !== runRef.current) return null;
        setError(describeCameraError(err));
        setStatus("error");
        return null;
      }
      if (run !== runRef.current) {
        s.getTracks().forEach((t) => t.stop());
        return null;
      }
      streamRef.current = s;
      setStream(s);
      setStatus("on");
      // The track can end on its own (camera unplugged, permission revoked).
      s.getVideoTracks?.().forEach((track) =>
        track.addEventListener?.("ended", () => {
          if (streamRef.current !== s) return;
          release();
          setError({ code: "camera-ended", message: "The camera stopped. Check it's connected, then turn it on again." });
          setStatus("error");
        })
      );
      refreshDevices();
      await attach(s);
      return s;
    },
    [attach, deviceId, height, refreshDevices, release, width]
  );

  const stop = useCallback(() => {
    runRef.current += 1;
    release();
    setStatus("off");
  }, [release]);

  const selectDevice = useCallback(
    (id) => {
      setDeviceId(id || null);
      try {
        if (id) localStorage.setItem(DEVICE_KEY, id);
        else localStorage.removeItem(DEVICE_KEY);
      } catch {
        // not remembered
      }
      if (streamRef.current) start({ deviceId: id || null });
    },
    [start]
  );

  // Re-attach after the preview element remounts (step changes).
  useEffect(() => {
    if (stream && videoRef.current && videoRef.current.srcObject !== stream) attach(stream);
  });

  useEffect(() => {
    refreshDevices();
    const md = navigator.mediaDevices;
    md?.addEventListener?.("devicechange", refreshDevices);
    return () => md?.removeEventListener?.("devicechange", refreshDevices);
  }, [refreshDevices]);

  useEffect(
    () => () => {
      runRef.current += 1;
      release();
    },
    [release]
  );

  return { videoRef, stream, status, error, devices, deviceId, selectDevice, start, stop };
}
