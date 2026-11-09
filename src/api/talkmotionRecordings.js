import JS2Py from "../remotepyjs";

/**
 * Promisified wrappers for the video-recording RPC functions used by the
 * sign-language subtitle designer. Mirrors the style of talkmotionUploads.js.
 * Server functions return {error: ...} on failure instead of ok:false, so we
 * reject on a present error field.
 */

function call(fnName, args) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer[fnName](...args, (result) => {
      if (!result || result.error) {
        reject(new Error(result?.error || `${fnName} failed`));
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Create a video recording row; resolves {video_recording_id, ...}.
 */
export function createVideoRecording(token, title, description, originalVideoUrl) {
  return call("createVideoRecording", [token, title, description, originalVideoUrl]);
}

/**
 * Update recording metadata. Pass null to keep an existing column value.
 */
export function updateVideoRecording(
  token,
  videoRecordingId,
  originalVideoTitle,
  originalVideoAuthor = null,
  originalVideoQuality = null,
  originalVideoDuration = null,
  originalVideoCurrentTimeLastUpdated = null,
  originalVideoPlaybackRate = null,
  originalVideoPlaybackQuality = null
) {
  return call("updateVideoRecording", [
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
 * Fetch a recording (optionally with its shots); resolves the recording row.
 */
export function getVideoRecording(token, recordingId, withShots) {
  return call("getVideoRecording", [token, parseInt(recordingId, 10), withShots]);
}

/**
 * Open a new shot on the server; resolves {video_recording_shot_id, ...}.
 */
export function openVideoRecordingShot(
  token,
  videoRecordingId,
  originalVideoStart,
  recordingStart,
  jsStart
) {
  return call("openVideoRecordingShot", [
    token,
    videoRecordingId,
    originalVideoStart,
    recordingStart,
    jsStart,
  ]);
}
