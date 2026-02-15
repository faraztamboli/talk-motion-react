import JS2Py from "../remotepyjs";

/**
 * API wrapper for TalkMotion resumable upload functions
 * All functions return Promises and check for {ok: true/false} in responses
 */

/**
 * Initialize a resumable upload for a video recording shot
 * @param {string} token - Authentication token
 * @param {number} shotId - Video recording shot ID
 * @param {string} contentType - MIME type (e.g., 'video/webm')
 * @param {number} totalSizeBytes - Total file size in bytes
 * @param {string} [checksumSha256] - Optional SHA-256 checksum (hex string)
 * @returns {Promise<{ok: boolean, upload_id?: string, ...}>}
 */
export function initVideoRecordingShotUpload(token, shotId, contentType, totalSizeBytes, checksumSha256 = null) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer.initVideoRecordingShotUpload(
      token,
      shotId,
      contentType,
      totalSizeBytes,
      checksumSha256,
      (result) => {
        if (!result || result.ok === false) {
          reject(new Error(result?.error || 'Upload initialization failed'));
          return;
        }
        resolve(result);
      }
    );
  });
}

/**
 * Upload a chunk of video data
 * @param {string} token - Authentication token
 * @param {string} uploadId - Upload ID from init
 * @param {number} partIndex - Zero-based part index
 * @param {number} byteOffset - Byte offset in the file
 * @param {string} chunkBase64 - Raw base64 string (no data: prefix)
 * @param {number} chunkSize - Size of this chunk in bytes
 * @returns {Promise<{ok: boolean, next_expected_offset?: number, ...}>}
 */
export function uploadVideoRecordingShotChunk(token, uploadId, partIndex, byteOffset, chunkBase64, chunkSize) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer.uploadVideoRecordingShotChunk(
      token,
      uploadId,
      partIndex,
      byteOffset,
      chunkBase64,
      chunkSize,
      (result) => {
        if (!result || result.ok === false) {
          reject(new Error(result?.error || 'Chunk upload failed'));
          return;
        }
        resolve(result);
      }
    );
  });
}

/**
 * Finalize the upload and close the shot
 * @param {string} token - Authentication token
 * @param {string} uploadId - Upload ID
 * @param {number} totalSizeBytes - Total file size
 * @param {number} originalVideoEnd - YouTube video timestamp when recording ended
 * @param {number} recordingEnd - Recording duration/end time
 * @param {number} jsEnd - JavaScript timestamp when recording ended
 * @returns {Promise<{ok: boolean, video_url?: string, storage_key?: string, ...}>}
 */
export function finalizeVideoRecordingShotUpload(token, uploadId, totalSizeBytes, originalVideoEnd, recordingEnd, jsEnd) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer.finalizeVideoRecordingShotUpload(
      token,
      uploadId,
      totalSizeBytes,
      originalVideoEnd,
      recordingEnd,
      jsEnd,
      (result) => {
        if (!result || result.ok === false) {
          reject(new Error(result?.error || 'Upload finalization failed'));
          return;
        }
        resolve(result);
      }
    );
  });
}

/**
 * Get upload status for a shot (for resume support)
 * @param {string} token - Authentication token
 * @param {number} shotId - Video recording shot ID
 * @returns {Promise<{ok: boolean, status?: string, upload_id?: string, upload_parts?: {...}, ...}>}
 */
export function getVideoRecordingShotUploadStatus(token, shotId) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer.getVideoRecordingShotUploadStatus(
      token,
      shotId,
      (result) => {
        if (!result || result.ok === false) {
          reject(new Error(result?.error || 'Failed to get upload status'));
          return;
        }
        resolve(result);
      }
    );
  });
}

/**
 * Abort an upload
 * @param {string} token - Authentication token
 * @param {string} uploadId - Upload ID
 * @param {string} reason - Reason for abort
 * @returns {Promise<{ok: boolean, ...}>}
 */
export function abortVideoRecordingShotUpload(token, uploadId, reason) {
  return new Promise((resolve, reject) => {
    JS2Py.PythonFunctions.TalkMotionServer.abortVideoRecordingShotUpload(
      token,
      uploadId,
      reason,
      (result) => {
        if (!result || result.ok === false) {
          reject(new Error(result?.error || 'Upload abort failed'));
          return;
        }
        resolve(result);
      }
    );
  });
}

