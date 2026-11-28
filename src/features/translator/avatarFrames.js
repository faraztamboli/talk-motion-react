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

const lerpNumber = (a, b, w) => (a > 0 && b > 0 ? a + (b - a) * w : b || a);

export function lerpFrame(a, b, w) {
  const block = (pa = [], pb = []) => pb.map((p, i) => lerpPoint(pa[i], p, w));
  const out = { lh: block(a.lh, b.lh), rh: block(a.rh, b.rh), pose: block(a.pose, b.pose) };
  if (a.body || b.body) {
    const ab = a.body || b.body;
    const bb = b.body || a.body;
    out.body = { shoulderWidth: lerpNumber(ab.shoulderWidth, bb.shoulderWidth, w), eyeHeight: lerpNumber(ab.eyeHeight, bb.eyeHeight, w) };
  }
  return out;
}

/** Longest stretch, in seconds, of a hand the tracker lost mid-sign that is filled in. */
export const MAX_HAND_GAP_SECONDS = 0.5;
const POSE_WRIST = { lh: 15, rh: 16 };
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_EYE = 2;
const RIGHT_EYE = 5;

const insidePicture = (p) => !isZero(p) && p[1] < 1 && p[1] > 0;

/**
 * Fill in a hand the tracker lost for a few frames in the middle of a sign (about a third of the
 * dictionary signs have such gaps). Without this the hand snaps to a resting shape and back.
 * The hand's shape is blended between the frames either side of the gap, and it moves with the
 * body tracker's wrist, which usually keeps tracking through the blur. A hand that really left
 * the picture (its wrist is outside) is left out, as is any gap longer than `maxGap` frames.
 */
export function fillHandGaps(frames, maxGap) {
  const out = frames.slice();
  for (const side of ["lh", "rh"]) {
    const has = out.map((f) => present(f?.[side]));
    let i = 0;
    while (i < out.length) {
      if (has[i] || !has.slice(0, i).some(Boolean)) {
        i += 1;
        continue;
      }
      let end = i;
      while (end < out.length && !has[end]) end += 1;
      if (end >= out.length) break; // trailing: the hand went away
      const gap = end - i;
      const before = out[i - 1];
      const after = out[end];
      const wristOf = (f) => f?.pose?.[POSE_WRIST[side]];
      const followWrist = [before, after, ...out.slice(i, end)].every((f) => insidePicture(wristOf(f)));
      const handLeft = out.slice(i, end).some((f) => wristOf(f) && !isZero(wristOf(f)) && !insidePicture(wristOf(f)));
      if (gap <= maxGap && !handLeft) {
        for (let k = i; k < end; k++) {
          const w = (k - i + 1) / (gap + 1);
          let hand = before[side].map((p, j) => lerpPoint(p, after[side][j], w));
          if (followWrist) {
            const expected = lerpPoint(wristOf(before), wristOf(after), w);
            const now = wristOf(out[k]);
            const shift = [now[0] - expected[0], now[1] - expected[1], 0];
            hand = hand.map((p) => (isZero(p) ? p : [p[0] + shift[0], p[1] + shift[1], p[2]]));
          }
          out[k] = { ...out[k], [side]: hand, filled: true };
        }
      }
      i = end;
    }
  }
  return out;
}

const median3 = (a, b, c) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));

/**
 * Take the tracker's jitter out of one block of points across the frames, with no delay (the
 * whole sign is known): a 3-frame median removes one-frame spikes, then a [1 2 1] blur smooths.
 * Points are only mixed with tracked neighbours, so a hand never drifts toward an untracked zero.
 */
function smoothBlock(frames, key) {
  const n = frames.length;
  const count = frames.reduce((m, f) => Math.max(m, f?.[key]?.length || 0), 0);
  if (n < 3 || !count) return frames.map((f) => f?.[key]);
  const at = (k, j) => {
    const p = frames[k]?.[key]?.[j];
    return isZero(p) ? null : p;
  };
  const pass = (get) => {
    const res = Array.from({ length: n }, () => new Array(count));
    for (let j = 0; j < count; j++) {
      for (let k = 0; k < n; k++) res[k][j] = get(k, j);
    }
    return res;
  };
  const medianed = pass((k, j) => {
    const p = at(k, j);
    const a = k > 0 ? at(k - 1, j) : null;
    const b = k < n - 1 ? at(k + 1, j) : null;
    if (!p || !a || !b) return p || frames[k]?.[key]?.[j];
    return [median3(a[0], p[0], b[0]), median3(a[1], p[1], b[1]), median3(a[2], p[2], b[2])];
  });
  const tracked = (k, j) => (k >= 0 && k < n && at(k, j) ? medianed[k][j] : null);
  return pass((k, j) => {
    const p = tracked(k, j);
    if (!p) return frames[k]?.[key]?.[j];
    const a = tracked(k - 1, j);
    const b = tracked(k + 1, j);
    if (!a || !b) return p;
    return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4, (a[2] + 2 * p[2] + b[2]) / 4];
  }).map((block, k) => (Array.isArray(frames[k]?.[key]) ? block.slice(0, frames[k][key].length) : frames[k]?.[key]));
}

export function smoothFrames(frames) {
  if (frames.length < 3) return frames;
  const lh = smoothBlock(frames, "lh");
  const rh = smoothBlock(frames, "rh");
  const pose = smoothBlock(frames, "pose");
  return frames.map((f, k) => ({ ...f, lh: lh[k], rh: rh[k], pose: pose[k] }));
}

const median = (values) => {
  const v = values.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
};

/**
 * The signer's size in this clip: median shoulder width and eye height above the shoulders.
 * Clips are filmed at different distances (shoulders from 0.35 to 0.6 of the picture), so the
 * rig must scale each sign by its own clip, not by whatever the previous sign was.
 */
export function bodyScale(frames) {
  const widths = [];
  const heights = [];
  for (const f of frames) {
    const p = f?.pose;
    if (!p || isZero(p[LEFT_SHOULDER]) || isZero(p[RIGHT_SHOULDER])) continue;
    const l = p[LEFT_SHOULDER];
    const r = p[RIGHT_SHOULDER];
    widths.push(Math.hypot(l[0] - r[0], l[1] - r[1]));
    if (!isZero(p[LEFT_EYE]) && !isZero(p[RIGHT_EYE])) heights.push((l[1] + r[1]) / 2 - (p[LEFT_EYE][1] + p[RIGHT_EYE][1]) / 2);
  }
  const shoulderWidth = median(widths);
  return shoulderWidth > 0.02 ? { shoulderWidth, eyeHeight: median(heights) } : null;
}

/**
 * Leave out the frames at the edges of a clip where no hand is in sight: the signer's arms at
 * rest before and after the sign. Between two signs those made the avatar drop its arms and
 * swing them back up for every word. The start is only trimmed when another sign came before
 * (`trimStart`), so the first sign of a sentence still rises from rest.
 */
export function trimRest(frames, { trimStart = false } = {}) {
  const has = frames.map((f) => present(f?.lh) || present(f?.rh));
  const first = has.indexOf(true);
  if (first < 0) return frames;
  const last = has.lastIndexOf(true);
  return frames.slice(trimStart ? first : 0, last + 1);
}

/**
 * One item's frames, ready to play: viewer orientation, lost hands filled in, jitter smoothed
 * (not for fingerspelling, whose handshapes are generated clean), rest frames trimmed, and the
 * clip's body scale on every frame.
 */
export function prepareFrames(item, { trimStart = false } = {}) {
  let frames = (item?.frames || []).map((f) => toViewer(f, item.mirrored !== false));
  if (!frames.length) return frames;
  const fps = Math.max(5, Math.min(30, Number(item.fps) || 15));
  frames = fillHandGaps(frames, Math.round(MAX_HAND_GAP_SECONDS * fps));
  if (!item.fingerspelled) frames = smoothFrames(frames);
  frames = trimRest(frames, { trimStart });
  const body = bodyScale(frames);
  return body ? frames.map((f) => ({ ...f, body })) : frames;
}

/**
 * The frames to play for one item, in viewer orientation, blended in from `fromFrame` (where
 * the avatar is now) so consecutive signs flow instead of jumping.
 */
export function framesForItem(item, fromFrame) {
  const frames = prepareFrames(item, { trimStart: Boolean(fromFrame) });
  if (!frames.length || !fromFrame) return frames;
  const transition = [];
  for (let i = 1; i <= TRANSITION_FRAMES; i++) {
    transition.push(lerpFrame(fromFrame, frames[0], i / (TRANSITION_FRAMES + 1)));
  }
  return [...transition, ...frames];
}
