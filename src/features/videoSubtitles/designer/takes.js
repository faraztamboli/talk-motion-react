/**
 * "Takes": the signing recorded for a recording, as the designer shows it. Merges what is on
 * the server (edit mode, other visits) with what this page is recording and uploading, and
 * says in plain words where each one stands.
 */

export const TAKE_STATUS = {
  recording: { tone: "live", label: "Recording" },
  stopping: { tone: "busy", label: "Finishing" },
  queued: { tone: "busy", label: "Waiting to save" },
  uploading: { tone: "busy", label: "Saving" },
  processing: { tone: "busy", label: "Preparing video" },
  saved: { tone: "ok", label: "Saved" },
  complete: { tone: "ok", label: "Saved" },
  failed: { tone: "error", label: "Couldn't save" },
  discarded: { tone: "muted", label: "Too short, not kept" },
  initialized: { tone: "error", label: "Not saved" },
  interrupted: { tone: "error", label: "Not saved" },
};

export const statusOf = (status) => TAKE_STATUS[status] || { tone: "muted", label: status || "" };

/**
 * One row per take, oldest start first. A take recorded on this page replaces its server row
 * (same shot id) because it carries the live status and an instant preview.
 * `now` is the video time, used as the end of the take being recorded.
 */
export function takeRows(segments, serverShots, now = null) {
  const localShotIds = new Set((segments || []).map((s) => s.shotId).filter(Boolean).map(String));
  const server = (serverShots || [])
    .filter((s) => !localShotIds.has(String(s.id)))
    .map((s) => ({
      key: `server-${s.id}`,
      source: "server",
      shotId: String(s.id),
      start: s.startTime,
      end: s.endTime,
      // An upload that stopped half-way (the page was closed) has no file and won't finish.
      status: s.status === "uploading" ? "interrupted" : s.status,
      progress: null,
      videoUrl: s.videoUrl,
      previewUrl: null,
      error: s.error,
      restored: false,
    }));
  const local = (segments || []).map((s) => ({
    key: `local-${s.localId}`,
    source: "local",
    localId: s.localId,
    shotId: s.shotId,
    start: s.start,
    end: s.end ?? (s.status === "recording" && now != null ? Math.max(s.start, now) : s.start),
    status: s.status,
    progress: s.progress,
    videoUrl: s.videoUrl,
    previewUrl: s.previewUrl,
    error: s.error,
    restored: Boolean(s.restored),
  }));
  return [...server, ...local]
    .sort((a, b) => a.start - b.start || String(a.key).localeCompare(String(b.key)))
    .map((row, index) => ({ ...row, number: index + 1 }));
}

/** Seconds of signing that are saved or on their way. */
export function signedSeconds(rows) {
  return (rows || [])
    .filter((r) => !["discarded", "failed", "initialized", "interrupted"].includes(r.status))
    .reduce((sum, r) => sum + Math.max(0, (r.end || 0) - (r.start || 0)), 0);
}

/**
 * The header's one-line answer to "is my work safe?":
 * { tone: ok|busy|error, text }.
 */
export function saveSummary(rows, { captionsSaving = false, captionsError = false } = {}) {
  const count = (statuses) => (rows || []).filter((r) => statuses.includes(r.status)).length;
  const failed = count(["failed"]);
  if (failed) return { tone: "error", text: failed === 1 ? "A take couldn't be saved" : `${failed} takes couldn't be saved` };
  if (captionsError) return { tone: "error", text: "Captions couldn't be saved" };
  const saving = count(["recording", "stopping", "queued", "uploading"]);
  if (saving) return { tone: "busy", text: saving === 1 ? "Saving your signing…" : `Saving ${saving} takes…` };
  if (captionsSaving) return { tone: "busy", text: "Saving captions…" };
  if (count(["processing"])) return { tone: "busy", text: "Saved. Preparing the video…" };
  return { tone: "ok", text: "All changes saved" };
}

/** "1:05" style duration. */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
