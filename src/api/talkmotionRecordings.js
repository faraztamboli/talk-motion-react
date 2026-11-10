/**
 * Promise wrappers for the video-recording RPCs used by the Subtitle Designer. Built on rpc():
 * server errors, failure payloads ({error}, {ok: false}, ...), timeouts and disconnects all
 * reject with an RpcError instead of resolving as if they had worked.
 */
import { rpc } from "./rpc";

/** Create a recording row; resolves {video_recording_id, ...}. */
export function createVideoRecording(token, title, description, originalVideoUrl) {
  return rpc("createVideoRecording", [token, title, description, originalVideoUrl]);
}

/**
 * Store the source video's YouTube metadata. A null keeps the stored column (servers from
 * 0.0.2 on; older ones overwrite with null, so pass every value you know).
 */
export function updateVideoRecording(
  token,
  videoRecordingId,
  originalVideoTitle = null,
  originalVideoAuthor = null,
  originalVideoQuality = null,
  originalVideoDuration = null,
  originalVideoCurrentTimeLastUpdated = null,
  originalVideoPlaybackRate = null,
  originalVideoPlaybackQuality = null
) {
  return rpc("updateVideoRecording", [
    token,
    videoRecordingId,
    originalVideoTitle,
    originalVideoAuthor,
    originalVideoQuality,
    originalVideoDuration,
    originalVideoCurrentTimeLastUpdated,
    originalVideoPlaybackRate,
    originalVideoPlaybackQuality,
  ]);
}

/**
 * Legacy recording fetch. Resolves null for a recording that doesn't exist or isn't shared
 * with you. Never asks for the legacy shot blobs.
 */
export function getVideoRecording(token, recordingId) {
  return rpc("getVideoRecording", [token, Number(recordingId), false], { raw: true });
}

/** Register a segment; resolves {video_recording_shot_id, ...}. */
export function openVideoRecordingShot(token, recordingId, originalVideoStart, recordingStart, jsStart) {
  return rpc("openVideoRecordingShot", [token, recordingId, originalVideoStart, recordingStart, jsStart]);
}
