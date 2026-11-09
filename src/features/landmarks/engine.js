/**
 * MediaPipe Tasks HolisticLandmarker, loaded once per page and shared.
 *
 * The WASM bundle is pinned to the installed npm version so the JS API and binaries can't
 * drift, and the model to a fixed version (1 is byte-identical to "latest" as of 2026-11).
 * GPU is tried first; if the GPU delegate can't start (no WebGL2, blocked GPU, some laptops),
 * the CPU delegate is used instead.
 */
const TASKS_VISION_VERSION = "0.10.35";
export const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
export const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task";

let enginePromise = null;

async function create(delegate) {
  const { FilesetResolver, HolisticLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const landmarker = await HolisticLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO",
    minFaceDetectionConfidence: 0.5,
    minPoseDetectionConfidence: 0.5,
    minHandLandmarksConfidence: 0.5,
  });
  return { landmarker, delegate };
}

/** Resolves { landmarker, delegate: "GPU" | "CPU" }. A failed load can be retried. */
export function loadEngine() {
  if (!enginePromise) {
    enginePromise = create("GPU")
      .catch((gpuErr) => {
        console.warn("MediaPipe GPU delegate unavailable, using CPU", gpuErr);
        return create("CPU");
      })
      .catch((err) => {
        enginePromise = null;
        throw err;
      });
  }
  return enginePromise;
}

/** Test hook. */
export function resetEngineForTests() {
  enginePromise = null;
}
