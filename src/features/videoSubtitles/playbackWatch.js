/**
 * Detecting jumps in YouTube playback while a segment records, so the segment can be split and
 * its timing stays true (a seek, a skip, a long stall).
 *
 * A sample is { videoTime (s), realTime (ms), rate }. Between two samples taken while playing,
 * the video should have advanced by elapsed real time x rate.
 */
export const JUMP_TOLERANCE_S = 1.2;

export function expectedVideoTime(last, realTimeNow) {
  return last.videoTime + ((realTimeNow - last.realTime) / 1000) * (last.rate || 1);
}

/** Returns null, or { endTime, newStartTime } for a split. */
export function detectJump(last, now, tolerance = JUMP_TOLERANCE_S) {
  if (!last || !now) return null;
  const expected = expectedVideoTime(last, now.realTime);
  if (Math.abs(now.videoTime - expected) <= tolerance) return null;
  // Forward seek (10 -> 60): end at the expected 10.5. Stall (10 -> 10.2 after 3 s): end at the
  // real 10.2. Backward seek (50 -> 20): end at the expected 50.5.
  const endTime = now.videoTime > last.videoTime ? Math.min(expected, now.videoTime) : expected;
  return { endTime, newStartTime: now.videoTime };
}
