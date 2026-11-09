/**
 * JS port of the server's feature_pipeline.py (FEATURE SPEC V2).
 *
 * MUST stay numerically identical to the Python implementation — the model is
 * trained on the Python features and any drift breaks in-browser inference.
 * If you change one, change both and bump FEATURE_SPEC_VERSION.
 *
 * Input frames are the slim landmark payloads produced by useHolisticModel:
 *   { leftHandLandmarks?: [{x,y,z}...21], rightHandLandmarks?: [...],
 *     poseLandmarks?: [{x,y,z,visibility}...33], faceLandmarks?: sparse[468] }
 */

export const FEATURE_SPEC_VERSION = 2;

const HAND_LANDMARK_COUNT = 21;
const HAND_WRIST = 0;
const HAND_MIDDLE_MCP = 9;

const POSE_SUBSET = [0, 11, 12, 13, 14, 15, 16, 23, 24];
const POSE_LEFT_SHOULDER = 11;
const POSE_RIGHT_SHOULDER = 12;

const FACE_SUBSET = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308,
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324,
  70, 63, 105, 66, 107,
  336, 296, 334, 293, 300,
];

const MAX_INTERP_GAP = 5;

// per-frame width: 2 hands x (20*3 shape + 3 wrist + 1 presence) + 9*3 pose + 32*3 face, x2 for deltas
export function featureCount() {
  const perFrame = 2 * (20 * 3 + 3 + 1) + POSE_SUBSET.length * 3 + FACE_SUBSET.length * 3;
  return perFrame * 2;
}

// landmarks list (or undefined) -> (count x 3) rows of [x,y,z], zeros when missing
function landmarkBlock(landmarks, count) {
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    const lm = landmarks && landmarks[i];
    out[i] = lm ? [lm.x || 0, lm.y || 0, lm.z || 0] : [0, 0, 0];
  }
  return out;
}

function handPresent(hand) {
  let sum = 0;
  for (let i = 0; i < hand.length; i++) {
    sum += Math.abs(hand[i][0]) + Math.abs(hand[i][1]) + Math.abs(hand[i][2]);
  }
  return sum > 1e-6 ? 1 : 0;
}

// Bridge short tracking dropouts by linear interpolation (mirrors
// feature_pipeline._interpolate_gaps). hands: T x 21 x 3, present: T
function interpolateGaps(hands, present) {
  const presentIdx = [];
  for (let t = 0; t < present.length; t++) if (present[t] > 0) presentIdx.push(t);
  if (presentIdx.length < 2) return;
  for (let k = 0; k < presentIdx.length - 1; k++) {
    const a = presentIdx[k];
    const b = presentIdx[k + 1];
    const gap = b - a;
    if (gap > 1 && gap <= MAX_INTERP_GAP) {
      for (let t = a + 1; t < b; t++) {
        const w = (t - a) / gap;
        for (let i = 0; i < HAND_LANDMARK_COUNT; i++) {
          for (let axis = 0; axis < 3; axis++) {
            hands[t][i][axis] = (1 - w) * hands[a][i][axis] + w * hands[b][i][axis];
          }
        }
        present[t] = 1;
      }
    }
  }
}

// Per-frame body frame from pose (mid-shoulder origin, shoulder-width scale)
function bodyFrame(pose) {
  const left = pose[POSE_LEFT_SHOULDER];
  const right = pose[POSE_RIGHT_SHOULDER];
  const leftTracked = Math.abs(left[0]) + Math.abs(left[1]) + Math.abs(left[2]) > 1e-6;
  const rightTracked = Math.abs(right[0]) + Math.abs(right[1]) + Math.abs(right[2]) > 1e-6;
  if (leftTracked && rightTracked) {
    const origin = [
      (left[0] + right[0]) / 2,
      (left[1] + right[1]) / 2,
      (left[2] + right[2]) / 2,
    ];
    const width = Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
    return { origin, scale: Math.max(width, 1e-3) };
  }
  return { origin: [0.5, 0.5, 0.0], scale: 1.0 };
}

// hand (21x3), present flag, body frame -> 64 floats
function handFeatures(hand, present, origin, scale) {
  const out = new Array(64).fill(0);
  if (!present) return out; // Python masks shape and wrist by presence
  const wrist = hand[HAND_WRIST];
  const mcp = hand[HAND_MIDDLE_MCP];
  const palm = Math.max(
    Math.hypot(mcp[0] - wrist[0], mcp[1] - wrist[1], mcp[2] - wrist[2]),
    1e-3
  );
  let k = 0;
  for (let i = 1; i < HAND_LANDMARK_COUNT; i++) {
    out[k++] = (hand[i][0] - wrist[0]) / palm;
    out[k++] = (hand[i][1] - wrist[1]) / palm;
    out[k++] = (hand[i][2] - wrist[2]) / palm;
  }
  out[k++] = (wrist[0] - origin[0]) / scale;
  out[k++] = (wrist[1] - origin[1]) / scale;
  out[k++] = (wrist[2] - origin[2]) / scale;
  out[k++] = 1; // presence
  return out;
}

/**
 * frames: [{t, data}] sign segments (features/translator/segmenter.js).
 * sequenceLength: model_meta_data.input_sequence_length.
 * Returns Float32Array of length sequenceLength * featureCount().
 */
export function framesToFeatures(frames, sequenceLength) {
  const T = frames.length;
  const leftHands = new Array(T);
  const rightHands = new Array(T);
  const poses = new Array(T);
  const faces = new Array(T);
  const leftPresent = new Array(T);
  const rightPresent = new Array(T);

  for (let t = 0; t < T; t++) {
    const d = frames[t].data;
    leftHands[t] = landmarkBlock(d.leftHandLandmarks, HAND_LANDMARK_COUNT);
    rightHands[t] = landmarkBlock(d.rightHandLandmarks, HAND_LANDMARK_COUNT);
    poses[t] = landmarkBlock(d.poseLandmarks, 33);
    faces[t] = landmarkBlock(d.faceLandmarks, 468);
    leftPresent[t] = handPresent(leftHands[t]);
    rightPresent[t] = handPresent(rightHands[t]);
  }

  interpolateGaps(leftHands, leftPresent);
  interpolateGaps(rightHands, rightPresent);

  const perFrame = featureCount() / 2; // 251 base features before deltas
  const base = new Array(T);

  for (let t = 0; t < T; t++) {
    const { origin, scale } = bodyFrame(poses[t]);
    const row = [];
    row.push(...handFeatures(leftHands[t], leftPresent[t], origin, scale));
    row.push(...handFeatures(rightHands[t], rightPresent[t], origin, scale));
    for (const idx of POSE_SUBSET) {
      row.push(
        (poses[t][idx][0] - origin[0]) / scale,
        (poses[t][idx][1] - origin[1]) / scale,
        (poses[t][idx][2] - origin[2]) / scale
      );
    }
    for (const idx of FACE_SUBSET) {
      row.push(
        (faces[t][idx][0] - origin[0]) / scale,
        (faces[t][idx][1] - origin[1]) / scale,
        (faces[t][idx][2] - origin[2]) / scale
      );
    }
    base[t] = row;
  }

  const width = featureCount();
  const out = new Float32Array(sequenceLength * width);
  const framesToUse = Math.min(T, sequenceLength);
  for (let t = 0; t < framesToUse; t++) {
    const prev = t > 0 ? base[t - 1] : base[0]; // delta of first frame is 0
    for (let f = 0; f < perFrame; f++) {
      out[t * width + f] = base[t][f];
      out[t * width + perFrame + f] = base[t][f] - prev[f];
    }
  }
  // remaining rows stay zero-padded, matching _pad_or_truncate
  return out;
}
