/**
 * Pure landmark helpers shared by capture (Collector) and recognition (Translator).
 *
 * Legacy convention: the original pipeline ran MediaPipe Holistic with selfieMode:true, which
 * mirrored landmarks horizontally. Every stored sample and every trained model uses that
 * convention, so MediaPipe Tasks results are converted to it exactly: flip x, swap the hand
 * lists, swap left/right paired pose and face indices (the pairs in feature_pipeline.py _mirror).
 */

export const POSE_MIRROR_PAIRS = [
  [11, 12], [13, 14], [15, 16], [23, 24],
];
export const FACE_MIRROR_PAIRS = [
  [61, 291], [146, 375], [91, 321], [181, 405], [84, 314],
  [78, 308], [95, 324], [88, 318], [178, 402], [87, 317],
  [70, 300], [63, 293], [105, 334], [66, 296], [107, 336],
];

/** Face-mesh points the server's feature pipeline uses (lips and eyebrows). */
export const FACE_SUBSET = new Set([
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308,
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324,
  70, 63, 105, 66, 107,
  336, 296, 334, 293, 300,
]);

/** Tasks results may wrap landmark lists per detected person; take the first person. */
export function firstInstance(landmarks) {
  if (!landmarks || landmarks.length === 0) return undefined;
  return Array.isArray(landmarks[0]) ? landmarks[0] : landmarks;
}

export function flipX(landmarks) {
  if (!landmarks) return undefined;
  return landmarks.map((lm) => (lm ? { ...lm, x: 1 - lm.x } : lm));
}

export function swapPairs(landmarks, pairs) {
  if (!landmarks) return undefined;
  const out = landmarks.slice();
  for (const [a, b] of pairs) {
    const tmp = out[a];
    out[a] = out[b];
    out[b] = tmp;
  }
  return out;
}

/** MediaPipe Tasks HolisticLandmarker result -> legacy selfie-mode results. */
export function toLegacyResults(result) {
  const tasksLeft = firstInstance(result?.leftHandLandmarks);
  const tasksRight = firstInstance(result?.rightHandLandmarks);
  const pose = firstInstance(result?.poseLandmarks);
  const face = firstInstance(result?.faceLandmarks);
  const legacy = {};
  // Mirrored image: the physical left hand appears (and is labelled) right.
  const left = flipX(tasksRight);
  const right = flipX(tasksLeft);
  if (left) legacy.leftHandLandmarks = left;
  if (right) legacy.rightHandLandmarks = right;
  if (pose) legacy.poseLandmarks = swapPairs(flipX(pose), POSE_MIRROR_PAIRS);
  if (face) legacy.faceLandmarks = swapPairs(flipX(face), FACE_MIRROR_PAIRS);
  return legacy;
}

const round4 = (v) => (typeof v === "number" ? Math.round(v * 10000) / 10000 : v);

function slimLandmark(lm) {
  if (!lm) return null;
  const out = { x: round4(lm.x), y: round4(lm.y), z: round4(lm.z) };
  if ("visibility" in lm) out.visibility = round4(lm.visibility);
  return out;
}

/**
 * What the server featurizes: hands, pose, and the face subset (other face points null, so
 * positions stay aligned). This is the frame payload of submitGestureSample and
 * translateGestureSample.
 */
export function slimResults(results) {
  const slim = {};
  if (results.leftHandLandmarks) slim.leftHandLandmarks = results.leftHandLandmarks.map(slimLandmark);
  if (results.rightHandLandmarks) slim.rightHandLandmarks = results.rightHandLandmarks.map(slimLandmark);
  if (results.poseLandmarks) slim.poseLandmarks = results.poseLandmarks.map(slimLandmark);
  if (results.faceLandmarks) {
    slim.faceLandmarks = results.faceLandmarks.map((lm, i) => (FACE_SUBSET.has(i) ? slimLandmark(lm) : null));
  }
  return slim;
}

export const hasHands = (frame) => Boolean(frame?.leftHandLandmarks || frame?.rightHandLandmarks);
