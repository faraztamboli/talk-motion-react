import { useRef } from "react";
import JS2Py from "../remotepyjs";
import { useDispatch, useSelector } from "react-redux";
import {
  setTrainingStatusOff,
  setTrainingStatusOn,
} from "../app/features/trainerSlice";
import useMessageApi from "./useMessageApi";
import { setIsSpeaking, setSpeakText } from "../app/features/speechSlice";
import {
  setIsModelLoading,
  setIsRecording,
} from "../app/features/converterSlice";
import useLocalStorage from "./useLocalStorage";
import {
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
  drawConnections,
  drawPoints,
} from "../utils/landmarkConnections";

// ---------------------------------------------------------------------------
// MediaPipe Tasks (Holistic Landmarker) setup.
// Replaces the deprecated legacy @mediapipe/holistic CDN bundle: actively
// maintained, faster WASM/GPU inference, better hand tracking under motion.
// The wasm CDN version is pinned to the installed npm package version so the
// JS API and wasm binaries can never drift apart.
// ---------------------------------------------------------------------------
const TASKS_VISION_VERSION = "0.10.35";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task";

let landmarkerPromise = null;

function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, HolisticLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HolisticLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        minFaceDetectionConfidence: 0.5,
        minPoseDetectionConfidence: 0.5,
        minHandLandmarksConfidence: 0.5,
      });
    })().catch((err) => {
      landmarkerPromise = null; // allow retry on next start
      throw err;
    });
  }
  return landmarkerPromise;
}

// Some Tasks results wrap landmark lists per detected instance; unwrap to a
// single person's landmark array (or undefined when nothing was detected).
function firstInstance(landmarks) {
  if (!landmarks || landmarks.length === 0) return undefined;
  return Array.isArray(landmarks[0]) ? landmarks[0] : landmarks;
}

// ---------------------------------------------------------------------------
// Legacy-convention mirroring.
// The old pipeline ran legacy Holistic with selfieMode:true, which flipped
// landmarks horizontally — every stored sample and trained model uses that
// convention. Tasks has no selfie mode, so we replicate it exactly: flip x,
// swap the hand lists, and swap left/right paired pose/face indices (the
// same pairs as feature_pipeline.py's _mirror).
// ---------------------------------------------------------------------------
const POSE_MIRROR_PAIRS = [
  [11, 12], [13, 14], [15, 16], [23, 24],
];
const FACE_MIRROR_PAIRS = [
  [61, 291], [146, 375], [91, 321], [181, 405], [84, 314],
  [78, 308], [95, 324], [88, 318], [178, 402], [87, 317],
  [70, 300], [63, 293], [105, 334], [66, 296], [107, 336],
];

function flipX(landmarks) {
  if (!landmarks) return undefined;
  return landmarks.map((lm) =>
    lm ? { ...lm, x: 1 - lm.x } : lm
  );
}

function swapPairs(landmarks, pairs) {
  if (!landmarks) return undefined;
  const out = landmarks.slice();
  for (const [a, b] of pairs) {
    const tmp = out[a];
    out[a] = out[b];
    out[b] = tmp;
  }
  return out;
}

function toLegacyResults(result) {
  const tasksLeft = firstInstance(result.leftHandLandmarks);
  const tasksRight = firstInstance(result.rightHandLandmarks);
  const pose = firstInstance(result.poseLandmarks);
  const face = firstInstance(result.faceLandmarks);
  const legacy = {};
  // mirrored image: the physical left hand appears (and is labeled) right
  const left = flipX(tasksRight);
  const right = flipX(tasksLeft);
  if (left) legacy.leftHandLandmarks = left;
  if (right) legacy.rightHandLandmarks = right;
  if (pose) legacy.poseLandmarks = swapPairs(flipX(pose), POSE_MIRROR_PAIRS);
  if (face) legacy.faceLandmarks = swapPairs(flipX(face), FACE_MIRROR_PAIRS);
  return legacy;
}

// ---------------------------------------------------------------------------
// Payload slimming (unchanged contract with the server).
// Face-mesh points actually used by the server's feature pipeline
// (feature_pipeline.FACE_SUBSET: lips + eyebrows). Everything else is sent as
// null — the server zero-fills nulls positionally, so indices stay aligned
// while the payload shrinks by an order of magnitude.
// ---------------------------------------------------------------------------
const FACE_SUBSET = new Set([
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308,
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324,
  70, 63, 105, 66, 107,
  336, 296, 334, 293, 300,
]);

const round4 = (v) => (typeof v === "number" ? Math.round(v * 10000) / 10000 : v);

function slimLandmark(lm) {
  if (!lm) return null;
  const out = { x: round4(lm.x), y: round4(lm.y), z: round4(lm.z) };
  if ("visibility" in lm) out.visibility = round4(lm.visibility);
  return out;
}

// Strip results down to what the server featurizes: hands, pose, and the
// face subset.
function slimResults(results) {
  const slim = {};
  if (results.leftHandLandmarks) {
    slim.leftHandLandmarks = results.leftHandLandmarks.map(slimLandmark);
  }
  if (results.rightHandLandmarks) {
    slim.rightHandLandmarks = results.rightHandLandmarks.map(slimLandmark);
  }
  if (results.poseLandmarks) {
    slim.poseLandmarks = results.poseLandmarks.map(slimLandmark);
  }
  if (results.faceLandmarks) {
    slim.faceLandmarks = results.faceLandmarks.map((lm, i) =>
      FACE_SUBSET.has(i) ? slimLandmark(lm) : null
    );
  }
  return slim;
}

function useHolisticModel1(options = {}) {
  const [token] = useLocalStorage("token");
  // When provided, each processed frame's slim landmark payload goes to this
  // callback instead of the pathname-based server streaming below (used by
  // the capture wizard and the continuous translator).
  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  const { modelId } = useSelector((state) => state.model);
  const { sequenceLength } = useSelector((state) => state.model);
  const { concept } = useSelector((state) => state.model);

  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);

  // used for gesture collection breaks (legacy streaming path)
  let last_gesture_collection_timestamp = Date.now();
  let collection_pause_time_millisec = 3000;

  const drawFrame = (video, results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // selfie view: mirror the video; the landmarks are already mirrored into
    // the legacy convention, so they line up with the flipped image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawConnections(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "rgba(255,255,255,0.25)",
      lineWidth: 1,
    });
    if (results.rightHandLandmarks) {
      drawConnections(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: "rgba(0,217,231,0.8)",
        lineWidth: 2,
      });
      drawPoints(ctx, results.rightHandLandmarks, {
        color: "white",
        fillColor: "rgb(0,217,231)",
        radius: 3,
      });
    }
    if (results.leftHandLandmarks) {
      drawConnections(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: "rgba(255,138,0,0.8)",
        lineWidth: 2,
      });
      drawPoints(ctx, results.leftHandLandmarks, {
        color: "white",
        fillColor: "rgb(255,138,0)",
        radius: 3,
      });
    }
  };

  const stopHolisticModel = () => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    // the landmarker instance stays cached module-wide: creating one is
    // expensive and it is safely reusable across start/stop cycles
  };

  const startHolisticModel = async () => {
    let landmarker;
    try {
      landmarker = await getLandmarker();
    } catch (err) {
      console.error("Failed to load MediaPipe Holistic Landmarker:", err);
      showMessage(
        "error",
        "Could not load the gesture recognition engine. Check your connection and try again."
      );
      dispatch(setIsModelLoading(false));
      return;
    }

    runningRef.current = true;

    const loop = () => {
      if (!runningRef.current) return;
      const video =
        webcamRef.current && webcamRef.current.video ? webcamRef.current.video : null;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          try {
            const result = landmarker.detectForVideo(video, performance.now());
            const legacy = toLegacyResults(result);
            dispatch(setIsModelLoading(false));
            drawFrame(video, legacy);
            sendToServer(legacy);
          } catch (err) {
            // skip bad frames rather than killing the loop
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const sendToServer = (results) => {
    const page = window.location.pathname;
    const data = slimResults(results);

    if (onFrameRef.current) {
      onFrameRef.current(data);
      return;
    }

    if (page === "/trainer/collect") {
      // legacy streaming collection path (the Collector page now uses the
      // capture wizard via onFrame, so this only serves older flows)
      if (
        last_gesture_collection_timestamp !== null &&
        Date.now() - last_gesture_collection_timestamp > collection_pause_time_millisec
      ) {
        dispatch(setTrainingStatusOn());
        JS2Py.PythonFunctions.TalkMotionServer.collectGestureAndConcept2(
          token,
          modelId,
          data,
          Date.now(),
          concept,
          sequenceLength,
          function (res) {
            let sample_count = res[1];
            let status = res[0];
            if (status == 1) {
              showMessage("success", "sample collected: " + sample_count);
              last_gesture_collection_timestamp = Date.now();
              dispatch(setTrainingStatusOff());
            }
          }
        );
      }
    } else if (page === "/converter") {
      // legacy per-frame translation path (the Converter page now uses the
      // continuous translator via onFrame)
      if ("leftHandLandmarks" in data || "rightHandLandmarks" in data) {
        JS2Py.PythonFunctions.TalkMotionServer.translateGestureToWords2(
          token,
          data,
          Date.now(),
          modelId,
          sequenceLength,
          function (res) {
            if (res.status == -1) {
              dispatch(setIsRecording(false));
              dispatch(setIsSpeaking(false));
            } else if (res.status == 0) {
              dispatch(setIsRecording(true));
              dispatch(setIsSpeaking(false));
            } else {
              dispatch(setIsSpeaking(true));
              dispatch(setSpeakText(res.prediction));
            }
          }
        );
      }
    }
  };

  return {
    webcamRef,
    audioRef,
    canvasRef,
    startHolisticModel,
    stopHolisticModel,
    contextHolder,
    showMessage,
  };
}

export default useHolisticModel1;
