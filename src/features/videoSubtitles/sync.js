/**
 * Playback synchronisation between the YouTube video and the recorded sign-language segments.
 *
 * Shot: { id, startTime, endTime, videoUrl } in seconds on the YouTube timeline. Segments may
 * overlap when an author re-records a passage; the newest (highest id) wins.
 */

export function findShotIndexForTime(shots, t) {
  if (!shots?.length || !Number.isFinite(t)) return -1;
  let best = -1;
  for (let i = 0; i < shots.length; i += 1) {
    const s = shots[i];
    if (t >= s.startTime && t < s.endTime) {
      if (best === -1 || Number(s.id) > Number(shots[best].id)) best = i;
    }
  }
  return best;
}

/** Where in the segment's own video `t` falls, clamped to the segment. */
export function shotOffset(shot, t) {
  const duration = Math.max(0, shot.endTime - shot.startTime);
  return Math.min(Math.max(0, t - shot.startTime), duration);
}

/** Only correct drift beyond this; constant nudging makes WebM/MP4 rebuffer and stutter. */
export const DRIFT_TOLERANCE_S = 0.35;

export function needsResync(signerTime, expectedTime, tolerance = DRIFT_TOLERANCE_S) {
  return Math.abs(signerTime - expectedTime) > tolerance;
}

/** The next segment that starts after t (to preload), or null. */
export function nextShotAfter(shots, t) {
  let next = null;
  for (const s of shots || []) {
    if (s.startTime > t && (!next || s.startTime < next.startTime)) next = s;
  }
  return next;
}
