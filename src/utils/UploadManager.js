import {
  initVideoRecordingShotUpload,
  uploadVideoRecordingShotChunk,
  finalizeVideoRecordingShotUpload,
  getVideoRecordingShotUploadStatus,
  abortVideoRecordingShotUpload,
} from "../api/talkmotionUploads";
import { blobChunkToRawBase64, sha256HexOfBlob } from "./uploadHelpers";

export const MAX_SEGMENT_BYTES = 200 * 1024 * 1024; // server limit
export const CHUNK_BYTES = 1024 * 1024;
const MAX_ATTEMPTS_PER_CHUNK = 4;

export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadCancelledError";
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resumable chunked upload of one recorded segment to its server shot.
 *
 * Resumes from the server's byte count when an earlier attempt got part-way (after a dropped
 * connection or a page reload), retries each chunk with backoff, and finalizes. Callers run one
 * upload at a time (RecordingEngine serializes them), so replies can never cross.
 */
export class UploadManager {
  constructor({ api } = {}) {
    this.api = api || {
      init: initVideoRecordingShotUpload,
      chunk: uploadVideoRecordingShotChunk,
      finalize: finalizeVideoRecordingShotUpload,
      status: getVideoRecordingShotUploadStatus,
      abort: abortVideoRecordingShotUpload,
    };
    this.active = new Map(); // shotId -> { cancelled, uploadId }
    this.retryDelayMs = 1000;
  }

  /**
   * @returns {Promise<{video_url: string, storage_key?: string, alreadyComplete?: boolean}>}
   */
  async upload({ token, shotId, blob, contentType, originalVideoEnd, recordingEnd, jsEnd, onProgress }) {
    if (!blob || blob.size === 0) throw new Error("The segment is empty");
    if (blob.size > MAX_SEGMENT_BYTES) {
      throw new Error(`The segment is ${Math.round(blob.size / 1048576)} MB; the limit is 200 MB`);
    }
    const state = { cancelled: false, uploadId: null, token };
    this.active.set(shotId, state);
    try {
      let offset = 0;
      let partIndex = 0;
      let status = null;
      try {
        status = await this.api.status(token, shotId);
      } catch {
        status = null; // unknown: start a fresh upload
      }
      if (status?.status === "complete") {
        onProgress?.(1);
        return { video_url: null, storage_key: status.storage_key, alreadyComplete: true };
      }
      if (status?.status === "uploading" && status.upload_id) {
        state.uploadId = status.upload_id;
        const parts = status.upload_parts || {};
        offset = Number(parts.bytes_received ?? (parts.parts || []).reduce((sum, p) => sum + (p.size || 0), 0)) || 0;
        partIndex = Array.isArray(parts.parts) ? parts.parts.length : 0;
        if (offset > blob.size) offset = 0;
      }
      if (!state.uploadId) {
        const checksum = blob.size <= 32 * 1024 * 1024 ? await sha256HexOfBlob(blob).catch(() => null) : null;
        const init = await this.api.init(token, shotId, contentType, blob.size, checksum);
        state.uploadId = init.upload_id;
        offset = 0;
        partIndex = 0;
      }
      onProgress?.(offset / blob.size);

      while (offset < blob.size) {
        if (state.cancelled) throw new UploadCancelledError();
        const size = Math.min(CHUNK_BYTES, blob.size - offset);
        const base64 = await blobChunkToRawBase64(blob.slice(offset, offset + size));
        let attempt = 0;
        for (;;) {
          try {
            const res = await this.api.chunk(token, state.uploadId, partIndex, offset, base64, size);
            offset = Number.isFinite(res?.next_expected_offset) ? res.next_expected_offset : offset + size;
            partIndex += 1;
            break;
          } catch (err) {
            attempt += 1;
            if (state.cancelled) throw new UploadCancelledError();
            if (attempt >= MAX_ATTEMPTS_PER_CHUNK) throw err;
            await sleep(this.retryDelayMs * 2 ** (attempt - 1));
          }
        }
        onProgress?.(Math.min(1, offset / blob.size));
      }
      if (state.cancelled) throw new UploadCancelledError();
      const result = await this.api.finalize(token, state.uploadId, blob.size, originalVideoEnd, recordingEnd, jsEnd);
      onProgress?.(1);
      return result;
    } finally {
      this.active.delete(shotId);
    }
  }

  async cancel(shotId, reason = "Cancelled by the author") {
    const state = this.active.get(shotId);
    if (!state) return;
    state.cancelled = true;
    if (state.uploadId) {
      await this.api.abort(state.token, state.uploadId, reason).catch(() => {});
    }
  }

  isUploading(shotId) {
    return this.active.has(shotId);
  }
}

export const uploadManager = new UploadManager();
