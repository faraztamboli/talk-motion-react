/**
 * One shape for recordings, segments and caption tracks, whichever server function produced
 * them: the new getVideoRecordingDetails / listVideoRecordings, or the legacy
 * getVideoRecording / getVideoRecordingsICanUse / getPublicVideoRecordings.
 */
import { parseYouTubeVideoId, watchUrlForVideoId } from "../../utils/youtubeUrl";
import { fromServerCues } from "./captions/cueFormats";

const toBool = (v) => v === true || v === 1 || v === "1" || v === "true";
const toNumber = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

export function thumbnailUrl(videoId, quality = "hqdefault") {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/${quality}.jpg` : null;
}

export function normalizeRecording(row) {
  if (!row || typeof row !== "object" || row.id === undefined || row.id === null) return null;
  const videoId = row.video_id || parseYouTubeVideoId(row.original_video_url || "") || null;
  const youtubeTitle = row.original_video_title || null;
  return {
    id: String(row.id),
    title: (row.title && String(row.title).trim()) || youtubeTitle || "Untitled recording",
    ownTitle: row.title || "",
    description: row.description || "",
    videoId,
    youtubeUrl: videoId ? watchUrlForVideoId(videoId) : row.original_video_url || null,
    youtubeTitle,
    youtubeAuthor: row.original_video_author || null,
    duration: toNumber(row.original_video_duration),
    isPublic: toBool(row.is_public),
    owner: row.create_user || null,
    creator: {
      username: row.create_user || null,
      fullname: row.creator_fullname || row.fullname || null,
      img: row.creator_sm_img || row.sm_img || null,
    },
    createdAt: row.create_time || null,
    updatedAt: row.update_time || null,
    shotCount: toNumber(row.shot_count),
    captionCount: toNumber(row.caption_count),
    thumbnailUrl: thumbnailUrl(videoId),
  };
}

export function normalizeShot(row) {
  if (!row || row.id === undefined || row.id === null) return null;
  const start = toNumber(row.original_video_start) ?? 0;
  const end = toNumber(row.original_video_end);
  return {
    id: String(row.id),
    startTime: start,
    endTime: end ?? start,
    status: row.status || (row.video_url ? "complete" : "initialized"),
    videoUrl: row.video_url && String(row.video_url).trim() ? String(row.video_url).trim() : null,
    contentType: row.content_type || null,
    error: row.error_message || null,
  };
}

/** Segments the viewer can play: finished, with a file and a positive length, by start time. */
export function playableShots(shots) {
  return (shots || [])
    .filter((s) => s && s.videoUrl && s.endTime > s.startTime && (s.status === "complete" || !s.status))
    .sort((a, b) => a.startTime - b.startTime || Number(a.id) - Number(b.id));
}

export function normalizeCaptionTrack(track) {
  if (!track) return null;
  const language = track.language || "en";
  return {
    id: track.id ? String(track.id) : language,
    language,
    label: track.label || language,
    cues: fromServerCues(track.cues),
    updatedAt: track.update_time || null,
  };
}

/** getVideoRecordingDetails reply -> details. */
export function normalizeDetails(res) {
  const recording = normalizeRecording({ ...(res?.recording || {}), video_id: res?.video_id });
  if (!recording) return null;
  if (res?.creator) {
    recording.creator = {
      username: res.creator.username || recording.owner,
      fullname: res.creator.fullname || null,
      img: res.creator.sm_img || null,
    };
  }
  const shots = (res?.shots || []).map(normalizeShot).filter(Boolean);
  return {
    recording,
    shots,
    playable: playableShots(shots),
    captions: (res?.captions || []).map(normalizeCaptionTrack).filter(Boolean),
    captionsAvailable: res?.captions_available !== false,
    canEdit: Boolean(res?.can_edit),
    access: res?.access || null,
  };
}

/** Legacy getVideoRecording reply (no access info, no captions) -> details. */
export function normalizeLegacyDetails(res, currentUsername) {
  if (!res || typeof res !== "object" || res.id === undefined) return null;
  const recording = normalizeRecording(res);
  const shots = (res.recording_shots || []).map(normalizeShot).filter(Boolean);
  const canEdit = Boolean(currentUsername) && recording.owner === currentUsername;
  return {
    recording,
    shots,
    playable: playableShots(shots),
    captions: [],
    captionsAvailable: false,
    canEdit,
    access: canEdit ? "owner" : recording.isPublic ? "public" : null,
  };
}

/**
 * Any list reply -> { rows, total }: listVideoRecordings {rows, total}, legacy
 * [rows, {"count(*)": n}], or a bare array (getPublicVideoRecordings).
 */
export function normalizeRecordingList(res) {
  let rows = [];
  let total = null;
  if (res && !Array.isArray(res) && Array.isArray(res.rows)) {
    rows = res.rows;
    total = toNumber(res.total);
  } else if (Array.isArray(res)) {
    if (res.length === 2 && Array.isArray(res[0]) && res[1] && typeof res[1] === "object" && !Array.isArray(res[1])) {
      rows = res[0];
      total = toNumber(res[1]["count(*)"] ?? res[1].count ?? res[1].total);
    } else {
      rows = res.filter((r) => r && typeof r === "object" && !Array.isArray(r));
    }
  }
  const normalized = rows.map(normalizeRecording).filter(Boolean);
  return { rows: normalized, total: total ?? normalized.length };
}
