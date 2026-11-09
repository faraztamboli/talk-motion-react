/**
 * Editing operations on caption cues ({ id, startMs, endMs, text }). All pure: they return a
 * new sorted array and never mutate their input. The limits match the server's
 * recording_service.validate_cues so problems show up before saving.
 */

export const MAX_CUES = 5000;
export const MAX_CUE_TEXT = 500;
export const DEFAULT_CUE_MS = 2000;
export const MIN_CUE_MS = 200;

let sequence = 0;
export const newCueId = () => `cue-${Date.now().toString(36)}-${(sequence += 1)}`;

const byTime = (a, b) => a.startMs - b.startMs || a.endMs - b.endMs;

export function sortCues(cues) {
  return [...(cues || [])].sort(byTime);
}

/** Index of the cue showing at `ms` (latest-starting one if several overlap), or -1. */
export function findCueIndexAt(cues, ms) {
  if (!cues?.length || !Number.isFinite(ms)) return -1;
  // last cue with startMs <= ms (binary search), then walk back over overlaps
  let lo = 0;
  let hi = cues.length - 1;
  let candidate = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].startMs <= ms) {
      candidate = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  for (let i = candidate; i >= 0 && i > candidate - 8; i -= 1) {
    if (cues[i].startMs <= ms && ms < cues[i].endMs) return i;
  }
  return -1;
}

/**
 * Add a cue starting at `ms`. It lasts `durationMs` but never runs into the next cue, and is
 * pushed past a cue already showing at `ms`. Returns { cues, cue }.
 */
export function addCueAt(cues, ms, { durationMs = DEFAULT_CUE_MS, text = "" } = {}) {
  const sorted = sortCues(cues);
  let start = Math.max(0, Math.round(ms));
  const showing = findCueIndexAt(sorted, start);
  if (showing >= 0) start = sorted[showing].endMs;
  const next = sorted.find((c) => c.startMs > start);
  let end = start + durationMs;
  if (next && next.startMs - start >= MIN_CUE_MS) end = Math.min(end, next.startMs);
  const cue = { id: newCueId(), startMs: start, endMs: end, text };
  return { cues: sortCues([...sorted, cue]), cue };
}

export function updateCue(cues, id, patch) {
  return sortCues((cues || []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function removeCue(cues, id) {
  return (cues || []).filter((c) => c.id !== id);
}

/**
 * Set a cue's start ("mark in") or end ("mark out") to `ms`, keeping start < end: marking in
 * past the end moves the end too; marking out before the start is ignored.
 */
export function setCueBoundary(cues, id, field, ms) {
  const value = Math.max(0, Math.round(ms));
  return sortCues(
    (cues || []).map((c) => {
      if (c.id !== id) return c;
      if (field === "startMs") {
        const endMs = c.endMs > value ? c.endMs : value + Math.max(MIN_CUE_MS, c.endMs - c.startMs);
        return { ...c, startMs: value, endMs };
      }
      if (value <= c.startMs) return c;
      return { ...c, endMs: value };
    })
  );
}

export function nudgeCue(cues, id, field, deltaMs) {
  const cue = (cues || []).find((c) => c.id === id);
  if (!cue) return cues;
  return setCueBoundary(cues, id, field, cue[field] + deltaMs);
}

/** Move a whole cue by deltaMs (both ends), never before 0. */
export function shiftCue(cues, id, deltaMs) {
  return sortCues(
    (cues || []).map((c) => {
      if (c.id !== id) return c;
      const delta = Math.max(-c.startMs, deltaMs);
      return { ...c, startMs: c.startMs + delta, endMs: c.endMs + delta };
    })
  );
}

/** Replace, or append (shifted past the existing last cue is NOT done: times are absolute). */
export function mergeCues(existing, incoming, mode = "replace") {
  if (mode === "append") return sortCues([...(existing || []), ...(incoming || [])]);
  return sortCues(incoming || []);
}

/**
 * Problems to fix before saving, and the overlaps the server will clamp.
 * Returns { errors: [string], overlaps: n, empty: n }.
 */
export function checkCues(cues) {
  const sorted = sortCues(cues);
  const errors = [];
  let overlaps = 0;
  let empty = 0;
  if (sorted.length > MAX_CUES) errors.push(`There are ${sorted.length} captions; the limit is ${MAX_CUES}.`);
  sorted.forEach((c, i) => {
    const text = (c.text || "").trim();
    if (!text) empty += 1;
    if (text.length > MAX_CUE_TEXT) errors.push(`Caption ${i + 1} is longer than ${MAX_CUE_TEXT} characters.`);
    if (!Number.isFinite(c.startMs) || !Number.isFinite(c.endMs)) errors.push(`Caption ${i + 1} has an invalid time.`);
    else if (c.endMs <= c.startMs) errors.push(`Caption ${i + 1} ends before it starts.`);
    if (i > 0 && c.startMs < sorted[i - 1].endMs) overlaps += 1;
  });
  return { errors, overlaps, empty };
}

/** Stable comparison for "unsaved changes" detection (ids ignored). */
export function cuesSignature(cues) {
  return JSON.stringify(sortCues(cues).map((c) => [Math.round(c.startMs), Math.round(c.endMs), (c.text || "").trim()]));
}
