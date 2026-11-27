/**
 * Avatar pose frames: { lh: 21 x [x,y,z], rh: 21 x [x,y,z], pose: 33 x [x,y,z] } in MediaPipe
 * normalized image coordinates.
 *
 * Viewer orientation: the avatar signs *to* the viewer, so it should look like the signer on
 * camera, not like a mirror image: x grows to the viewer's right, "left" means the signer's own
 * left, and x is on the same scale as y (0.5 is the middle of the picture).
 *
 * Poses extracted from dictionary videos are stored that way already. Samples recorded in the app
 * use the legacy selfie-mode convention (landmarkMath.js): x mirrored, left and right swapped,
 * and x as a share of the picture's width. They are converted here: flipped back, sides swapped
 * back, and widened by the camera's shape. getConceptPoses says which kind (`mirrored`).
 */

/** Width / height of the camera pictures the recorded samples came from (most were 4:3). */
export const RECORDED_ASPECT = 4 / 3;

export const TRANSITION_FRAMES = 6;

const flipBlock = (block) =>
  Array.isArray(block) ? block.map((p) => (isZero(p) ? p : [0.5 + (0.5 - p[0]) * RECORDED_ASPECT, p[1], p[2] * RECORDED_ASPECT])) : block;

/** Pose points that are a left/right pair: eyes, ears, mouth corners, then every limb joint. */
const POSE_PAIRS = [[1, 4], [2, 5], [3, 6], [7, 8], [9, 10], ...Array.from({ length: 11 }, (_, i) => [11 + 2 * i, 12 + 2 * i])];

function swapSides(pose) {
  if (!Array.isArray(pose)) return pose;
  const out = pose.slice();
  for (const [a, b] of POSE_PAIRS) {
    if (b < out.length) [out[a], out[b]] = [out[b], out[a]];
  }
  return out;
}

export function isZero(p) {
  return !p || (p[0] === 0 && p[1] === 0 && p[2] === 0);
}

export function present(block) {
  return Array.isArray(block) && block.some((p) => !isZero(p));
}

/** A frame in viewer orientation. Zero points (not tracked) stay zero. */
export function toViewer(frame, mirrored) {
  if (!frame || !mirrored) return frame;
  return { lh: flipBlock(frame.rh), rh: flipBlock(frame.lh), pose: swapSides(flipBlock(frame.pose)) };
}

function lerpPoint(a, b, w) {
  if (isZero(a)) return b;
  if (isZero(b)) return a;
  return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
}

export function lerpFrame(a, b, w) {
  const block = (pa = [], pb = []) => pb.map((p, i) => lerpPoint(pa[i], p, w));
  return { lh: block(a.lh, b.lh), rh: block(a.rh, b.rh), pose: block(a.pose, b.pose) };
}

/**
 * The frames to play for one item, in viewer orientation, blended in from `fromFrame` (where
 * the avatar is now) so consecutive signs flow instead of jumping.
 */
export function framesForItem(item, fromFrame) {
  const frames = (item?.frames || []).map((f) => toViewer(f, item.mirrored !== false));
  if (!frames.length || !fromFrame) return frames;
  const transition = [];
  for (let i = 1; i <= TRANSITION_FRAMES; i++) {
    transition.push(lerpFrame(fromFrame, frames[0], i / (TRANSITION_FRAMES + 1)));
  }
  return [...transition, ...frames];
}
