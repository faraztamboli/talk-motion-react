/**
 * Resumable segment upload RPCs (see TalkMotionServer: initVideoRecordingShotUpload ...).
 * Built on rpc(), so {ok: false, error} replies, timeouts and disconnects reject.
 */
import { rpc } from "./rpc";

/** Resolves {upload_id, shot_id, status, ...}. */
export function initVideoRecordingShotUpload(token, shotId, contentType, totalSizeBytes, checksumSha256 = null) {
  return rpc("initVideoRecordingShotUpload", [token, shotId, contentType, totalSizeBytes, checksumSha256]);
}

/** chunkBase64 is raw base64 (no data: prefix). Resolves {ok, received_bytes, next_expected_offset}. */
export function uploadVideoRecordingShotChunk(token, uploadId, partIndex, byteOffset, chunkBase64, chunkSize) {
  return rpc("uploadVideoRecordingShotChunk", [token, uploadId, partIndex, byteOffset, chunkBase64, chunkSize]);
}

/** Resolves {ok, video_url, storage_key, size_bytes, checksum_sha256}. */
export function finalizeVideoRecordingShotUpload(token, uploadId, totalSizeBytes, originalVideoEnd, recordingEnd, jsEnd) {
  return rpc("finalizeVideoRecordingShotUpload", [token, uploadId, totalSizeBytes, originalVideoEnd, recordingEnd, jsEnd]);
}

/** Resolves {ok, status, upload_id, upload_parts: {bytes_received, parts}, ...} (for resume). */
export function getVideoRecordingShotUploadStatus(token, shotId) {
  return rpc("getVideoRecordingShotUploadStatus", [token, shotId]);
}

export function abortVideoRecordingShotUpload(token, uploadId, reason) {
  return rpc("abortVideoRecordingShotUpload", [token, uploadId, reason]);
}
