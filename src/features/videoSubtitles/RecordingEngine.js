import { openVideoRecordingShot } from "../../api/talkmotionRecordings";
import { uploadManager as defaultUploader } from "../../utils/UploadManager";
import { segmentStore as defaultStore } from "../../utils/indexedDBStorage";

/**
 * Records sign-language segments against a YouTube video and uploads them.
 *
 * The camera stream comes from outside (useRecorderCamera); the engine never opens or closes
 * it. One MediaRecorder per segment, so every file is complete with its own header.
 *
 * States: idle (no camera) | ready (camera, not recording) | armed (play to record) |
 *         recording (a segment is being captured)
 *
 * Segment statuses: recording -> stopping -> queued -> uploading -> saved
 *                                                   \-> failed (retry) | discarded (empty)
 *
 * Guarantees:
 *  - A segment's server row is registered when it starts; if that fails, the upload step
 *    registers it again, so no recording is lost to a hiccup.
 *  - Each finished segment is written to IndexedDB before uploading and removed only after
 *    the upload is finalized. restorePending() re-queues what a reload left behind.
 *  - Uploads run one at a time, in order (the server matches replies by function name).
 *  - A new segment never starts while the previous recorder is still stopping, and disarm()
 *    waits only for the recorder, not for uploads.
 *  - Long takes are split automatically (maxSegmentSeconds) to stay under the upload limit.
 *
 * Events (CustomEvent): "statechange" {state}, "segmentschange" {segments}, "error" {code, message}
 */

export const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4;codecs=avc1",
  "video/mp4",
];

export function pickMimeType(Recorder = typeof MediaRecorder === "undefined" ? undefined : MediaRecorder) {
  if (!Recorder || typeof Recorder.isTypeSupported !== "function") return null;
  return MIME_CANDIDATES.find((c) => Recorder.isTypeSupported(c)) ?? null;
}

const ACTIVE = new Set(["recording", "stopping", "queued", "uploading"]);

export class RecordingEngine extends EventTarget {
  constructor({
    token,
    store = defaultStore,
    uploader = defaultUploader,
    openShot = openVideoRecordingShot,
    deleteShot = null,
    Recorder = typeof MediaRecorder === "undefined" ? undefined : MediaRecorder,
    maxSegmentSeconds = 300,
    videoBitsPerSecond = 2_500_000,
  } = {}) {
    super();
    this.token = token;
    this.store = store;
    this.uploader = uploader;
    this.openShot = openShot;
    this.deleteShotOnServer = deleteShot;
    this.Recorder = Recorder;
    this.maxSegmentSeconds = maxSegmentSeconds;
    this.videoBitsPerSecond = videoBitsPerSecond;

    this.state = "idle";
    this.stream = null;
    this.mimeType = pickMimeType(Recorder);
    this.recordingId = null;
    this.segments = [];
    this._active = null; // { segment, recorder, stopped: Promise }
    this._stopping = Promise.resolve();
    this._pumping = false;
    this._nextLocalId = 1;
    this._destroyed = false;
  }

  // ------------------------------------------------------------------ events

  _setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.dispatchEvent(new CustomEvent("statechange", { detail: { state } }));
  }

  _emitSegments() {
    this.dispatchEvent(new CustomEvent("segmentschange", { detail: { segments: this.segments.map((s) => ({ ...s })) } }));
  }

  _emitError(code, message) {
    this.dispatchEvent(new CustomEvent("error", { detail: { code, message } }));
  }

  _patch(segment, patch) {
    Object.assign(segment, patch);
    this._emitSegments();
  }

  // ------------------------------------------------------------------ setup

  setStream(stream) {
    this.stream = stream || null;
    if (!this.stream) {
      if (this._active) this.stopSegment(this._active.segment.start);
      this._setState("idle");
    } else if (this.state === "idle") {
      this._setState("ready");
    }
  }

  setRecordingId(recordingId) {
    if (this.recordingId && String(this.recordingId) !== String(recordingId)) {
      // A different recording: segments of the old one keep uploading but leave the list.
      this.segments = this.segments.filter((s) => ACTIVE.has(s.status) && s.recordingId === String(recordingId));
      this._emitSegments();
    }
    this.recordingId = recordingId ? String(recordingId) : null;
  }

  canRecord() {
    return Boolean(this.stream && this.Recorder && this.mimeType && this.recordingId);
  }

  // ------------------------------------------------------------------ arm / disarm

  arm() {
    if (!this.stream) {
      this._emitError("no-camera", "Turn the camera on first.");
      return false;
    }
    if (!this.Recorder || !this.mimeType) {
      this._emitError("unsupported", "This browser can't record video. Use a recent Chrome, Edge, Firefox or Safari.");
      return false;
    }
    if (!this.recordingId) {
      this._emitError("no-recording", "Choose a video first.");
      return false;
    }
    if (this.state === "ready") this._setState("armed");
    return this.state === "armed" || this.state === "recording";
  }

  /** Stop recording mode. Ends the running segment (its upload continues in the background). */
  async disarm(videoTime) {
    if (this._active) await this.stopSegment(videoTime);
    await this._stopping;
    this._setState(this.stream ? "ready" : "idle");
  }

  isArmed() {
    return this.state === "armed" || this.state === "recording";
  }

  // ------------------------------------------------------------------ segments

  /** Begin a segment at a YouTube time. Waits for a previous recorder that is still stopping. */
  async startSegment(videoTime) {
    await this._stopping;
    if (this._destroyed || this.state !== "armed" || this._active || !this.canRecord()) return null;

    const segment = {
      localId: this._nextLocalId++,
      key: `${this.recordingId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      recordingId: this.recordingId,
      shotId: null,
      status: "recording",
      start: Number(videoTime) || 0,
      end: null,
      jsStart: Date.now(),
      jsEnd: null,
      mimeType: this.mimeType,
      progress: 0,
      sizeBytes: 0,
      error: null,
      videoUrl: null,
      previewUrl: null,
    };

    let recorder;
    try {
      recorder = new this.Recorder(this.stream, { mimeType: this.mimeType, videoBitsPerSecond: this.videoBitsPerSecond });
    } catch (err) {
      this._emitError("recorder", `Recording couldn't start: ${err?.message || err}`);
      return null;
    }
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise((resolve) => {
      recorder.onstop = () => resolve(chunks);
      recorder.onerror = (event) => {
        segment.error = event?.error?.message || "The recorder stopped unexpectedly";
        resolve(chunks);
      };
    });

    // Register the server row in parallel; failures are retried by the upload step.
    segment.idPromise = this._register(segment);

    recorder.start(1000);
    this._active = { segment, recorder, stopped };
    this.segments.push(segment);
    this._setState("recording");
    this._emitSegments();
    return segment;
  }

  _register(segment) {
    const promise = Promise.resolve()
      .then(() => this.openShot(this.token, segment.recordingId, segment.start, 0, segment.jsStart))
      .then((res) => {
        const id = res?.video_recording_shot_id;
        if (!id) throw new Error("The server didn't return a segment id");
        segment.shotId = String(id);
        this._emitSegments();
        return segment.shotId;
      });
    promise.catch(() => {}); // handled in _upload
    return promise;
  }

  /** End the running segment at a YouTube time and queue its upload. */
  async stopSegment(videoTime) {
    const active = this._active;
    if (!active) return;
    this._active = null;
    const { segment, recorder, stopped } = active;
    segment.end = Math.max(segment.start, Number(videoTime) || segment.start);
    segment.jsEnd = Date.now();
    this._patch(segment, { status: "stopping" });
    if (this.state === "recording") this._setState("armed");

    const done = (async () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // already stopped
      }
      const chunks = await stopped;
      const blob = new Blob(chunks, { type: (segment.mimeType || "video/webm").split(";")[0] });
      if (!blob.size || segment.end - segment.start < 0.2) {
        this._patch(segment, { status: "discarded", error: "Too short to keep" });
        return;
      }
      segment.blob = blob;
      segment.sizeBytes = blob.size;
      segment.previewUrl = typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(blob) : null;
      await this.store.put(this._storeRecord(segment));
      this._patch(segment, { status: "queued" });
      this._pump();
    })();
    this._stopping = done.catch(() => {});
    await done;
  }

  /** The video jumped (seek, rate change): close the segment and continue in a new one. */
  async split(endTime, newStartTime, { resume = true } = {}) {
    if (!this._active) return;
    await this.stopSegment(endTime);
    if (resume && this.state === "armed") await this.startSegment(newStartTime);
  }

  /** Call with the current video time while playing; splits takes longer than maxSegmentSeconds. */
  async tick(videoTime) {
    const active = this._active;
    if (!active || !this.maxSegmentSeconds) return;
    if (videoTime - active.segment.start >= this.maxSegmentSeconds) await this.split(videoTime, videoTime);
  }

  _storeRecord(segment) {
    return {
      key: segment.key,
      recordingId: segment.recordingId,
      shotId: segment.shotId,
      localId: segment.localId,
      blob: segment.blob,
      mimeType: segment.mimeType,
      start: segment.start,
      end: segment.end,
      jsStart: segment.jsStart,
      jsEnd: segment.jsEnd,
      createdAt: segment.jsEnd || Date.now(),
    };
  }

  // ------------------------------------------------------------------ uploads

  async _pump() {
    if (this._pumping) return;
    this._pumping = true;
    try {
      for (;;) {
        const next = this.segments.find((s) => s.status === "queued");
        if (!next) break;
        await this._upload(next);
      }
    } finally {
      this._pumping = false;
    }
  }

  async _upload(segment) {
    this._patch(segment, { status: "uploading", progress: 0, error: null });
    try {
      let shotId = segment.shotId;
      if (!shotId) {
        try {
          shotId = await segment.idPromise;
        } catch {
          segment.idPromise = this._register(segment);
          shotId = await segment.idPromise;
        }
        await this.store.put(this._storeRecord(segment)); // remember the id for a resume
      }
      const result = await this.uploader.upload({
        token: this.token,
        shotId,
        blob: segment.blob,
        contentType: segment.blob.type || segment.mimeType,
        originalVideoEnd: segment.end,
        recordingEnd: Math.max(0, (segment.jsEnd || 0) - (segment.jsStart || 0)),
        jsEnd: segment.jsEnd,
        onProgress: (p) => this._patch(segment, { progress: p }),
      });
      await this.store.delete(segment.key);
      segment.blob = null;
      this._patch(segment, { status: "saved", progress: 1, videoUrl: result?.video_url || segment.videoUrl || null });
    } catch (err) {
      const message = err?.message || "Upload failed";
      this._patch(segment, { status: "failed", error: message });
      this._emitError("upload-failed", `A segment couldn't be uploaded: ${message}`);
    }
  }

  /** Try a failed segment again. */
  retry(localId) {
    const segment = this.segments.find((s) => s.localId === localId);
    if (!segment || segment.status !== "failed" || !segment.blob) {
      this._emitError("retry-unavailable", "This segment can't be retried.");
      return false;
    }
    this._patch(segment, { status: "queued", error: null });
    this._pump();
    return true;
  }

  /**
   * Remove a segment: a local one (queued, failed, discarded) from this device, a saved one from
   * the server too. A segment that is recording or uploading can't be removed yet.
   */
  async remove(localId) {
    const segment = this.segments.find((s) => s.localId === localId);
    if (!segment) return false;
    if (segment.status === "recording" || segment.status === "stopping" || segment.status === "uploading") {
      this._emitError("busy", "Wait for this segment to finish before deleting it.");
      return false;
    }
    if (segment.status === "saved" && segment.shotId && this.deleteShotOnServer) {
      try {
        await this.deleteShotOnServer(segment.shotId);
      } catch (err) {
        this._emitError("delete-failed", `The segment couldn't be deleted: ${err?.message || err}`);
        return false;
      }
    }
    await this.store.delete(segment.key);
    if (segment.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(segment.previewUrl);
    this.segments = this.segments.filter((s) => s !== segment);
    this._emitSegments();
    return true;
  }

  /** Re-queue segments a reload or crash left in IndexedDB for this recording. */
  async restorePending(recordingId = this.recordingId) {
    if (!recordingId) return 0;
    const records = await this.store.list(String(recordingId));
    let restored = 0;
    for (const record of records) {
      if (this.segments.some((s) => s.key === record.key) || !record.blob) continue;
      const segment = {
        localId: this._nextLocalId++,
        key: record.key,
        recordingId: String(record.recordingId),
        shotId: record.shotId ? String(record.shotId) : null,
        status: "queued",
        start: record.start,
        end: record.end,
        jsStart: record.jsStart,
        jsEnd: record.jsEnd,
        mimeType: record.mimeType,
        progress: 0,
        sizeBytes: record.blob.size,
        error: null,
        videoUrl: null,
        previewUrl: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(record.blob) : null,
        blob: record.blob,
        restored: true,
      };
      segment.idPromise = segment.shotId ? Promise.resolve(segment.shotId) : Promise.reject(new Error("unregistered"));
      segment.idPromise.catch(() => {});
      this.segments.push(segment);
      restored += 1;
    }
    if (restored) {
      this._emitSegments();
      this._pump();
    }
    return restored;
  }

  hasPendingWork() {
    return this.segments.some((s) => ACTIVE.has(s.status) || (s.status === "failed" && s.blob));
  }

  /** Finish the running segment (so it is stored) and stop accepting new ones. */
  async destroy(videoTime = null) {
    if (this._destroyed) return;
    if (this._active) await this.stopSegment(videoTime ?? this._active.segment.start);
    this._destroyed = true;
    this.stream = null;
    this.state = "idle";
  }
}
