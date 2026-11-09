import { openVideoRecordingShot } from "../../api/talkmotionRecordings";
import { uploadManager } from "../../utils/UploadManager";

/**
 * Recording engine for the sign-language subtitle designer.
 *
 * Replaces the old window-global camcorder/recording/recording_shot classes.
 * One MediaRecorder per shot (start/stop, never pause/resume) so every blob
 * is a complete WebM/MP4 file with a valid header — this removes the old
 * header-validation/settle-window machinery and its silent segment loss.
 *
 * Shot identity is carried through promise chains on the shot object itself;
 * there is no float-time matching and no "active shot" fallback.
 *
 * Events (CustomEvent on this EventTarget):
 *  - "statechange"  detail: {state}  — idle|cameraReady|armed|recording|error
 *  - "shotschange"  detail: {shots}  — full snapshot after any shot update
 *  - "error"        detail: {code, message, cause}
 */
export class RecordingEngine extends EventTarget {
  constructor({ token }) {
    super();
    this.token = token;
    this.state = "idle";
    this.stream = null;
    this.recorder = null;
    this.mimeType = null;
    this.recordingId = null; // server video_recording id
    this.shots = [];
    this._activeShot = null;
    this._nextLocalId = 1;
    this._destroyed = false;
  }

  // ---------------------------------------------------------------- state

  _setState(state) {
    if (this._destroyed && state !== "idle") return;
    this.state = state;
    this.dispatchEvent(new CustomEvent("statechange", { detail: { state } }));
  }

  _emitShots() {
    this.dispatchEvent(
      new CustomEvent("shotschange", { detail: { shots: [...this.shots] } })
    );
  }

  _emitError(code, message, cause) {
    this.dispatchEvent(
      new CustomEvent("error", { detail: { code, message, cause } })
    );
  }

  setRecordingId(recordingId) {
    this.recordingId = recordingId;
  }

  // --------------------------------------------------------------- camera

  /**
   * Request the camera and attach the live preview to a <video> element.
   * Distinguishes permission-denied from no-camera for the UI.
   */
  async initCamera(videoElement) {
    if (this.stream) return this.stream;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 390 } },
      });
    } catch (err) {
      const code =
        err.name === "NotAllowedError" || err.name === "SecurityError"
          ? "camera-denied"
          : err.name === "NotFoundError"
            ? "camera-missing"
            : "camera-error";
      this._setState("error");
      this._emitError(code, err.message, err);
      throw err;
    }
    if (this._destroyed) {
      this.stream.getTracks().forEach((t) => t.stop());
      return null;
    }
    if (videoElement) {
      videoElement.srcObject = this.stream;
      videoElement.muted = true;
      await videoElement.play().catch(() => {});
    }
    this.mimeType = RecordingEngine.pickMimeType();
    this._setState("cameraReady");
    return this.stream;
  }

  static pickMimeType() {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    if (typeof MediaRecorder === "undefined") return null;
    return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? null;
  }

  // ------------------------------------------------------------ arm/disarm

  /** Enable recording mode: shots start whenever the video plays. */
  arm() {
    if (!this.stream) {
      this._emitError("not-ready", "Camera is not ready yet");
      return false;
    }
    if (this.state === "armed" || this.state === "recording") return true;
    this._setState("armed");
    return true;
  }

  /** Disable recording mode; ends the current shot if one is running. */
  async disarm(videoTime) {
    if (this.state === "recording") {
      await this.stopShot(videoTime);
    }
    if (this.state !== "error") {
      this._setState(this.stream ? "cameraReady" : "idle");
    }
  }

  isArmed() {
    return this.state === "armed" || this.state === "recording";
  }

  // ----------------------------------------------------------------- shots

  /**
   * Begin a new shot at the given YouTube video time. Registers the shot on
   * the server in parallel with recording; the returned id lands on this
   * exact shot object via the promise chain.
   */
  startShot(videoTime) {
    if (this.state !== "armed") return null;
    if (!this.recordingId) {
      this._emitError("no-recording", "Recording is not registered on the server yet");
      return null;
    }

    const shot = {
      localId: this._nextLocalId++,
      recordingShotId: null,
      status: "recording",
      original_video_start: videoTime,
      original_video_end: null,
      js_start: Date.now(),
      js_end: null,
      uploadProgress: 0,
      videoUrl: null,
      error: null,
    };
    shot.idPromise = openVideoRecordingShot(
      this.token,
      this.recordingId,
      shot.original_video_start,
      0,
      shot.js_start
    ).then((result) => {
      shot.recordingShotId = result.video_recording_shot_id;
      this._emitShots();
      return shot.recordingShotId;
    });
    // Surface registration failures on the shot; upload will re-await and fail loudly.
    shot.idPromise.catch((err) => {
      shot.error = err.message;
      this._emitShots();
    });

    const chunks = [];
    const recorder = new MediaRecorder(this.stream, { mimeType: this.mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    shot.stopPromise = new Promise((resolve) => {
      recorder.onstop = () => resolve(chunks);
      recorder.onerror = (event) => {
        shot.error = event.error?.message || "Recorder error";
        resolve(chunks);
      };
    });
    recorder.start(1000);

    this.recorder = recorder;
    this._activeShot = shot;
    this.shots.push(shot);
    this._setState("recording");
    this._emitShots();
    return shot;
  }

  /**
   * End the current shot at the given video time; assembles the blob and
   * hands it to the upload manager. Resolves when the upload settles.
   */
  async stopShot(videoTime) {
    const shot = this._activeShot;
    const recorder = this.recorder;
    if (!shot || !recorder) return;
    this._activeShot = null;
    this.recorder = null;

    shot.original_video_end = videoTime;
    shot.js_end = Date.now();

    if (recorder.state !== "inactive") recorder.stop();
    const chunks = await shot.stopPromise;
    if (this.state === "recording") this._setState("armed");

    const blob = new Blob(chunks, { type: this.mimeType || "video/webm" });
    if (blob.size === 0) {
      shot.status = "discarded";
      shot.error = "Empty segment (too short to capture)";
      this._emitShots();
      this._emitError("empty-segment", "The segment was too short and was discarded");
      return;
    }
    shot.blob = blob;
    await this._uploadShot(shot);
  }

  async _uploadShot(shot) {
    shot.status = "uploading";
    shot.uploadProgress = 0;
    shot.error = null;
    this._emitShots();

    try {
      // Ensure the server-side shot id has arrived before uploading.
      await shot.idPromise;
      const result = await uploadManager.startOrResumeShotUpload({
        token: this.token,
        shotId: shot.recordingShotId,
        blob: shot.blob,
        contentType: shot.blob.type || this.mimeType || "video/webm",
        original_video_end: shot.original_video_end,
        recording_end: shot.blob.size,
        js_end: shot.js_end,
        onProgress: (progress) => {
          shot.uploadProgress = progress;
          this._emitShots();
        },
      });
      shot.status = "saved";
      shot.uploadProgress = 1;
      shot.videoUrl = result?.video_url ?? null;
      shot.blob = null; // release memory; IndexedDB copy is cleaned by UploadManager
    } catch (err) {
      shot.status = "failed";
      shot.error = err.message;
      this._emitError("upload-failed", `Upload failed: ${err.message}`, err);
    }
    this._emitShots();
  }

  /** Retry a failed upload for a shot (blob still held or in IndexedDB). */
  async retryUpload(localId) {
    const shot = this.shots.find((s) => s.localId === localId);
    if (!shot || shot.status !== "failed" || !shot.blob) {
      this._emitError("retry-unavailable", "This segment can no longer be retried");
      return;
    }
    await this._uploadShot(shot);
  }

  hasPendingUploads() {
    return this.shots.some(
      (s) => s.status === "uploading" || s.status === "recording"
    );
  }

  // -------------------------------------------------------------- teardown

  /**
   * Stop everything: finalizes a running shot (so its data is not lost),
   * then releases the camera. Idempotent.
   */
  async destroy(videoTime = null) {
    if (this._destroyed) return;
    this._destroyed = true;
    try {
      if (this._activeShot && this.recorder) {
        await this.stopShot(videoTime ?? this._activeShot.original_video_start);
      }
    } finally {
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.recorder = null;
      this.state = "idle";
    }
  }
}
