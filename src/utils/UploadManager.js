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
const STATUS_ATTEMPTS = 3;
// After a failure, keep asking for about half a minute: a dropped socket needs time to reconnect.
const RECOVERY_ATTEMPTS = 7;
const MAX_STATUS_DELAY_MS = 8000;
export const PROCESSING_POLL_MS = 2500;
export const PROCESSING_TIMEOUT_MS = 20 * 60 * 1000;

/** The server has the whole video: converting it for playback ('processing') or done. */
const isUploaded = (reply) => reply?.status === "complete" || reply?.status === "processing" || reply?.already_uploaded === true;

function uploadedResult(reply) {
  return {
    status: reply?.status === "processing" ? "processing" : "complete",
    video_url: reply?.video_url || null,
    storage_key: reply?.storage_key,
    alreadyComplete: true,
  };
}

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
 *
 * Before reporting a failure it asks the server where the segment stands: a reply lost to a
 * dropped connection or a timeout must not turn a saved segment into "Upload failed".
 * The result's status is "complete", or "processing" while the server converts the video for
 * playback (waitUntilProcessed follows that).
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

  /** The shot's upload status, retried a few times; null when the server can't be asked. */
  async _status(token, shotId, state = null, attempts = STATUS_ATTEMPTS) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (state?.cancelled) return null;
      try {
        return await this.api.status(token, shotId);
      } catch {
        if (attempt < attempts - 1) await sleep(Math.min(MAX_STATUS_DELAY_MS, this.retryDelayMs * 2 ** attempt));
      }
    }
    return null;
  }

  /**
   * @returns {Promise<{status: "complete"|"processing", video_url: string|null, storage_key?: string, alreadyComplete?: boolean}>}
   */
  async upload(params) {
    const { token, shotId, blob } = params;
    if (!blob || blob.size === 0) throw new Error("The segment is empty");
    if (blob.size > MAX_SEGMENT_BYTES) {
      throw new Error(`The segment is ${Math.round(blob.size / 1048576)} MB; the limit is 200 MB`);
    }
    try {
      return await this._upload(params);
    } catch (err) {
      if (err instanceof UploadCancelledError) throw err;
      const after = await this._status(token, shotId, null, RECOVERY_ATTEMPTS);
      if (isUploaded(after)) {
        params.onProgress?.(1);
        return uploadedResult(after);
      }
      throw err;
    }
  }

  async _upload({ token, shotId, blob, contentType, originalVideoEnd, recordingEnd, jsEnd, onProgress }) {
    const state = { cancelled: false, uploadId: null, token };
    this.active.set(shotId, state);
    try {
      let offset = 0;
      let partIndex = 0;
      const status = await this._status(token, shotId, state); // null: unknown, start a fresh upload
      if (isUploaded(status)) {
        onProgress?.(1);
        return uploadedResult(status);
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
        if (isUploaded(init)) {
          onProgress?.(1);
          return uploadedResult(init);
        }
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
      // Servers before 0.0.7-classic convert inside finalize and say nothing about status.
      return { ...result, status: result?.status === "processing" ? "processing" : "complete", video_url: result?.video_url || null };
    } finally {
      this.active.delete(shotId);
    }
  }

  /**
   * Wait while the server converts an uploaded segment for playback.
   * Resolves { status: "complete", video_url }; rejects with the server's reason when the
   * conversion failed, or after `timeoutMs`. Transient errors while asking are retried.
   */
  async waitUntilProcessed(token, shotId, { intervalMs = PROCESSING_POLL_MS, timeoutMs = PROCESSING_TIMEOUT_MS, isCancelled } = {}) {
    const until = Date.now() + timeoutMs;
    for (;;) {
      if (isCancelled?.()) throw new UploadCancelledError();
      let reply = null;
      try {
        reply = await this.api.status(token, shotId);
      } catch {
        reply = null;
      }
      if (reply?.status === "complete") return { status: "complete", video_url: reply.video_url || null };
      if (reply?.status === "failed") throw new Error(reply.error_message || "The video couldn't be prepared for playback");
      if (reply && reply.status !== "processing") throw new Error("The upload didn't finish. Try again.");
      if (Date.now() > until) throw new Error("Preparing the video is taking longer than usual. Reopen the recording later to check.");
      await sleep(intervalMs);
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
