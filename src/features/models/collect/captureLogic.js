/**
 * Rules for recording one sample. Frames are the slim landmark payloads from useLandmarker,
 * stamped { t, data }.
 *
 * A take keeps every frame between the first and the last frame with a hand, so the timing of
 * the sign survives (dropping hand-less frames in the middle used to splice signs together).
 */

export const DEFAULT_MAX_SECONDS = 2;
export const NO_HANDS_GIVE_UP_MS = 5000;
/** After hands were seen, this long without hands ends the take early. */
export const HANDS_DOWN_STOP_MS = 600;
export const MIN_FRAMES = 8;

export const hasHand = (frame) => Boolean(frame?.data?.leftHandLandmarks || frame?.data?.rightHandLandmarks);

/** Drop hand-less frames before the first and after the last frame with a hand. */
export function trimTake(frames) {
  let start = frames.findIndex(hasHand);
  if (start < 0) return [];
  let end = frames.length - 1;
  while (end > start && !hasHand(frames[end])) end -= 1;
  return frames.slice(start, end + 1);
}

/**
 * Should recording stop now? Returns null to keep going, or a reason:
 *   "time"       the take reached its length
 *   "hands-down" hands were seen and then left the frame
 *   "no-hands"   no hands appeared for NO_HANDS_GIVE_UP_MS
 */
export function stopReason(frames, startedAt, now, maxMs) {
  const firstHand = frames.findIndex(hasHand);
  // The take's time ran out before any hand appeared: that's "no hands", not an empty take.
  if (now - startedAt >= maxMs) return firstHand < 0 ? "no-hands" : "time";
  if (firstHand < 0) return now - startedAt >= NO_HANDS_GIVE_UP_MS ? "no-hands" : null;
  let lastHandAt = null;
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    if (hasHand(frames[i])) {
      lastHandAt = frames[i].t;
      break;
    }
  }
  const handFrames = frames.filter(hasHand).length;
  if (handFrames >= MIN_FRAMES && lastHandAt != null && now - lastHandAt >= HANDS_DOWN_STOP_MS) return "hands-down";
  return null;
}

/** Hints shown in review. Problems block Keep; tips don't. */
export function reviewTake(frames) {
  const problems = [];
  const tips = [];
  if (frames.length < MIN_FRAMES) problems.push("That was too short to learn from. Try again and sign a little slower.");
  const handRatio = frames.length ? frames.filter(hasHand).length / frames.length : 0;
  if (frames.length && handRatio < 0.6) tips.push("Your hands were out of view for part of the take.");
  const duration = frames.length > 1 ? frames[frames.length - 1].t - frames[0].t : 0;
  return { problems, tips, duration, frameCount: frames.length, handRatio };
}
