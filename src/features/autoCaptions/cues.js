/** Mapping between API caption cues and the Subtitle Designer's editable subtitle rows. */

const pad = (n, w = 2) => String(n).padStart(w, "0");

/** 83250 -> "00:01:23.250" (WebVTT timestamp). */
export function formatTimestamp(ms) {
  const total = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(total % 1000, 3)}`;
}

/** 83250 -> "1:23.2" for compact display next to a subtitle. */
export function formatClock(ms) {
  const total = Math.max(0, Math.round(Number(ms) || 0));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${m}:${pad(s)}.${Math.floor((total % 1000) / 100)}`;
}

/**
 * API cues [{start_ms, end_ms, text}] -> subtitle rows [{id, startMs, endMs, text}],
 * sorted by start time. Malformed or empty cues are dropped; an end before the start is
 * pushed to start + 1 s so the row stays playable.
 */
export function cuesToSubtitles(cues) {
  if (!Array.isArray(cues)) return [];
  return cues
    .map((c) => ({
      startMs: Math.max(0, Math.round(Number(c?.start_ms))),
      endMs: Math.round(Number(c?.end_ms)),
      text: typeof c?.text === "string" ? c.text.trim() : "",
    }))
    .filter((c) => Number.isFinite(c.startMs) && c.text)
    .map((c) => ({ ...c, endMs: Number.isFinite(c.endMs) && c.endMs > c.startMs ? c.endMs : c.startMs + 1000 }))
    .sort((a, b) => a.startMs - b.startMs)
    .map((c, i) => ({ id: `auto-${i + 1}`, ...c }));
}

/** Subtitle rows -> WebVTT text (used to download the edited captions). */
export function subtitlesToVtt(subtitles) {
  const blocks = subtitles
    .filter((s) => s.text.trim())
    .map((s) => `${formatTimestamp(s.startMs)} --> ${formatTimestamp(s.endMs)}\n${s.text.trim().replace(/\s*\n\s*/g, " ")}`);
  return `WEBVTT\n\n${blocks.join("\n\n")}${blocks.length ? "\n" : ""}`;
}
