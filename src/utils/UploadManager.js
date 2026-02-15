import {
  initVideoRecordingShotUpload,
  uploadVideoRecordingShotChunk,
  finalizeVideoRecordingShotUpload,
  getVideoRecordingShotUploadStatus,
  abortVideoRecordingShotUpload,
} from '../api/talkmotionUploads';
import { blobChunkToRawBase64, sha256HexOfBlob } from './uploadHelpers';
import { putShotBlob, getShotBlob, deleteShotBlob } from './indexedDBStorage';

/**
 * UploadManager handles resumable chunked uploads for video recording shots
 */
export class UploadManager {
  constructor() {
    this.activeUploads = new Map(); // shotId -> upload state
  }

  /**
   * Start or resume an upload for a shot
   * @param {Object} params
   * @param {string} params.token - Auth token
   * @param {number} params.shotId - Shot ID
   * @param {Blob} params.blob - Video blob
   * @param {string} params.contentType - MIME type
   * @param {number} params.original_video_end - YouTube video end time
   * @param {number} params.recording_end - Recording end time
   * @param {number} params.js_end - JS timestamp
   * @param {Function} [params.onProgress] - Progress callback (progress: 0-1)
   * @param {Function} [params.onError] - Error callback
   * @param {Function} [params.onComplete] - Complete callback (result)
   * @returns {Promise<{video_url: string, storage_key: string}>}
   */
  async startOrResumeShotUpload({
    token,
    shotId,
    blob,
    contentType,
    original_video_end,
    recording_end,
    js_end,
    onProgress,
    onError,
    onComplete,
  }) {
    // Validate blob size (max 200MB)
    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (blob.size > MAX_SIZE) {
      const error = new Error(`Blob size (${blob.size} bytes) exceeds maximum (${MAX_SIZE} bytes)`);
      if (onError) onError(error);
      throw error;
    }

    // Store blob in IndexedDB for resume support
    try {
      await putShotBlob(shotId, blob);
    } catch (err) {
      console.warn('Failed to store blob in IndexedDB:', err);
      // Continue anyway - resume won't work but upload can proceed
    }

    // Check upload status
    let uploadId;
    let nextOffset = 0;
    let nextPartIndex = 0;

    try {
      const status = await getVideoRecordingShotUploadStatus(token, shotId);
      
      if (status.status === 'uploading' && status.upload_id) {
        // Resume existing upload
        uploadId = status.upload_id;
        
        // Calculate next offset from upload_parts
        if (status.upload_parts) {
          if (status.upload_parts.bytes_received !== undefined) {
            nextOffset = status.upload_parts.bytes_received;
          } else if (status.upload_parts.parts && status.upload_parts.parts.length > 0) {
            // Calculate from parts list
            const parts = status.upload_parts.parts;
            nextOffset = parts.reduce((sum, part) => sum + (part.size || 0), 0);
          }
          nextPartIndex = status.upload_parts.parts ? status.upload_parts.parts.length : 0;
        }
        
        console.log(`Resuming upload for shot ${shotId}: offset=${nextOffset}, partIndex=${nextPartIndex}`);
      } else {
        // Start new upload
        const checksum = await sha256HexOfBlob(blob).catch(() => null);
        const initResult = await initVideoRecordingShotUpload(
          token,
          shotId,
          contentType,
          blob.size,
          checksum
        );
        uploadId = initResult.upload_id;
        nextOffset = 0;
        nextPartIndex = 0;
        console.log(`Starting new upload for shot ${shotId}: uploadId=${uploadId}`);
      }
    } catch (err) {
      console.error('Failed to get/init upload status:', err);
      // Try to initialize anyway
      try {
        const checksum = await sha256HexOfBlob(blob).catch(() => null);
        const initResult = await initVideoRecordingShotUpload(
          token,
          shotId,
          contentType,
          blob.size,
          checksum
        );
        uploadId = initResult.upload_id;
        nextOffset = 0;
        nextPartIndex = 0;
      } catch (initErr) {
        if (onError) onError(initErr);
        throw initErr;
      }
    }

    // Track upload state
    const uploadState = {
      shotId,
      uploadId,
      blob,
      token,
      cancelled: false,
      onProgress,
      onError,
      onComplete,
    };
    this.activeUploads.set(shotId, uploadState);

    // Upload chunks
    const CHUNK_SIZE = 1024 * 1024; // 1MB default (max 5MB)
    const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB max
    let currentOffset = nextOffset;
    let currentPartIndex = nextPartIndex;
    const MAX_RETRIES = 3;
    const RETRY_DELAY_BASE = 1000; // 1 second base delay

    try {
      while (currentOffset < blob.size && !uploadState.cancelled) {
        // Calculate chunk size (don't exceed remaining bytes or max)
        const remaining = blob.size - currentOffset;
        const chunkSize = Math.min(CHUNK_SIZE, remaining, MAX_CHUNK_SIZE);
        const chunk = blob.slice(currentOffset, currentOffset + chunkSize);

        // Convert to raw base64
        const chunkBase64 = await blobChunkToRawBase64(chunk);

        // Upload chunk with retry
        let uploaded = false;
        let retryCount = 0;
        while (!uploaded && retryCount < MAX_RETRIES && !uploadState.cancelled) {
          try {
            const result = await uploadVideoRecordingShotChunk(
              token,
              uploadId,
              currentPartIndex,
              currentOffset,
              chunkBase64,
              chunkSize
            );

            // Update offset from server response (if provided)
            if (result.next_expected_offset !== undefined) {
              currentOffset = result.next_expected_offset;
            } else {
              currentOffset += chunkSize;
            }
            currentPartIndex++;
            uploaded = true;

            // Update progress
            const progress = currentOffset / blob.size;
            if (onProgress) {
              onProgress(progress);
            }

            // Yield to UI thread every few chunks
            if (currentPartIndex % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          } catch (err) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount - 1); // Exponential backoff
              console.warn(`Chunk upload failed, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES}):`, err);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw new Error(`Failed to upload chunk after ${MAX_RETRIES} retries: ${err.message}`);
            }
          }
        }

        if (uploadState.cancelled) {
          throw new Error('Upload cancelled by user');
        }
      }

      // Finalize upload
      if (!uploadState.cancelled) {
        const finalizeResult = await finalizeVideoRecordingShotUpload(
          token,
          uploadId,
          blob.size,
          original_video_end,
          recording_end,
          js_end
        );

        // Clean up
        await deleteShotBlob(shotId).catch(() => {});
        this.activeUploads.delete(shotId);

        if (onComplete) {
          onComplete(finalizeResult);
        }

        return finalizeResult;
      }
    } catch (err) {
      this.activeUploads.delete(shotId);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }

  /**
   * Cancel an active upload
   * @param {number} shotId - Shot ID
   * @param {string} reason - Reason for cancellation
   */
  async cancelUpload(shotId, reason = 'User cancelled') {
    const uploadState = this.activeUploads.get(shotId);
    if (!uploadState) {
      return;
    }

    uploadState.cancelled = true;

    try {
      await abortVideoRecordingShotUpload(uploadState.token, uploadState.uploadId, reason);
    } catch (err) {
      console.warn('Failed to abort upload on server:', err);
    }

    this.activeUploads.delete(shotId);
  }

  /**
   * Get active upload state for a shot
   * @param {number} shotId - Shot ID
   * @returns {Object|null} Upload state or null
   */
  getUploadState(shotId) {
    return this.activeUploads.get(shotId) || null;
  }
}

// Singleton instance
export const uploadManager = new UploadManager();


