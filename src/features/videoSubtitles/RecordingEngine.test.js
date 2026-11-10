import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecordingEngine, pickMimeType } from "./RecordingEngine";
import { UploadManager } from "../../utils/UploadManager";

class FakeRecorder {
  static supported = new Set(["video/webm;codecs=vp9", "video/webm"]);
  static isTypeSupported(type) {
    return FakeRecorder.supported.has(type);
  }
  static instances = [];
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = "inactive";
    this.bytes = 10;
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    // like real MediaRecorder: final data, then stop, asynchronously
    queueMicrotask(() => {
      if (this.bytes) this.ondataavailable?.({ data: new Blob(["x".repeat(this.bytes)], { type: "video/webm" }) });
      this.onstop?.();
    });
  }
}

function makeStore() {
  const rows = new Map();
  return {
    rows,
    put: vi.fn(async (r) => rows.set(r.key, { ...r })),
    delete: vi.fn(async (k) => rows.delete(k)),
    list: vi.fn(async (rid) => [...rows.values()].filter((r) => r.recordingId === String(rid))),
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function makeEngine(overrides = {}) {
  const store = overrides.store || makeStore();
  let nextShot = 100;
  const openShot = overrides.openShot || vi.fn(async () => ({ video_recording_shot_id: nextShot++ }));
  const uploader = overrides.uploader || { upload: vi.fn(async ({ shotId }) => ({ video_url: `https://v/${shotId}.mp4` })) };
  const engine = new RecordingEngine({
    token: "tok",
    store,
    uploader,
    openShot,
    deleteShot: overrides.deleteShot,
    Recorder: FakeRecorder,
    maxSegmentSeconds: overrides.maxSegmentSeconds ?? 300,
  });
  engine.setStream({ id: "stream" });
  engine.setRecordingId(7);
  return { engine, store, openShot, uploader };
}

beforeEach(() => {
  FakeRecorder.instances = [];
  globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe("pickMimeType", () => {
  it("prefers WebM and falls back to MP4 (Safari)", () => {
    expect(pickMimeType(FakeRecorder)).toBe("video/webm;codecs=vp9");
    expect(pickMimeType({ isTypeSupported: (t) => t === "video/mp4" })).toBe("video/mp4");
    expect(pickMimeType(undefined)).toBeNull();
  });
});

describe("RecordingEngine", () => {
  it("moves through ready -> armed -> recording -> armed -> ready", async () => {
    const { engine } = makeEngine();
    const states = [];
    engine.addEventListener("statechange", (e) => states.push(e.detail.state));
    expect(engine.state).toBe("ready");
    expect(engine.arm()).toBe(true);
    await engine.startSegment(5);
    expect(engine.state).toBe("recording");
    await engine.stopSegment(9);
    expect(engine.state).toBe("armed");
    await engine.disarm(9);
    expect(states).toEqual(["armed", "recording", "armed", "ready"]);
  });

  it("refuses to arm without a camera, a recording or recorder support", () => {
    const errors = [];
    const engine = new RecordingEngine({ token: "t", Recorder: FakeRecorder });
    engine.addEventListener("error", (e) => errors.push(e.detail.code));
    expect(engine.arm()).toBe(false);
    engine.setStream({});
    expect(engine.arm()).toBe(false);
    const noRecorder = new RecordingEngine({ token: "t", Recorder: undefined });
    noRecorder.addEventListener("error", (e) => errors.push(e.detail.code));
    noRecorder.setStream({});
    noRecorder.setRecordingId(1);
    expect(noRecorder.arm()).toBe(false);
    expect(errors).toEqual(["no-camera", "no-recording", "unsupported"]);
  });

  it("does not start segments unless armed", async () => {
    const { engine } = makeEngine();
    expect(await engine.startSegment(1)).toBeNull();
    expect(FakeRecorder.instances).toHaveLength(0);
  });

  it("stores the segment before uploading and removes it after; registers the shot with the start time", async () => {
    const { engine, store, openShot, uploader } = makeEngine();
    engine.arm();
    await engine.startSegment(12.5);
    expect(openShot).toHaveBeenCalledWith("tok", "7", 12.5, 0, expect.any(Number));
    await engine.stopSegment(20);
    await flush();
    expect(store.put).toHaveBeenCalled();
    expect(uploader.upload).toHaveBeenCalledWith(
      expect.objectContaining({ shotId: "100", originalVideoEnd: 20, contentType: "video/webm" })
    );
    const [seg] = engine.segments;
    expect(seg).toMatchObject({ status: "saved", videoUrl: "https://v/100.mp4", start: 12.5, end: 20 });
    expect(store.rows.size).toBe(0);
    expect(engine.hasPendingWork()).toBe(false);
  });

  it("uploads one segment at a time, in order", async () => {
    const gates = [deferred(), deferred()];
    let running = 0;
    let maxRunning = 0;
    const uploader = {
      upload: vi.fn(async ({ shotId }) => {
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        await gates[uploader.upload.mock.calls.length - 1].promise;
        running -= 1;
        return { video_url: `u${shotId}` };
      }),
    };
    const { engine } = makeEngine({ uploader });
    engine.arm();
    await engine.startSegment(0);
    await engine.stopSegment(2);
    await engine.startSegment(3);
    await engine.stopSegment(5);
    await flush();
    expect(uploader.upload).toHaveBeenCalledTimes(1);
    expect(engine.segments.map((s) => s.status)).toEqual(["uploading", "queued"]);
    gates[0].resolve();
    await flush();
    await flush();
    expect(uploader.upload).toHaveBeenCalledTimes(2);
    gates[1].resolve();
    await flush();
    await flush();
    expect(maxRunning).toBe(1);
    expect(engine.segments.map((s) => s.status)).toEqual(["saved", "saved"]);
  });

  it("registers again during upload when the first registration failed", async () => {
    const openShot = vi.fn().mockRejectedValueOnce(new Error("socket down")).mockResolvedValue({ video_recording_shot_id: 55 });
    const { engine, uploader } = makeEngine({ openShot });
    engine.arm();
    await engine.startSegment(1);
    await engine.stopSegment(3);
    await flush();
    await flush();
    expect(openShot).toHaveBeenCalledTimes(2);
    expect(uploader.upload).toHaveBeenCalledWith(expect.objectContaining({ shotId: "55" }));
    expect(engine.segments[0].status).toBe("saved");
  });

  it("marks failed uploads and retries them", async () => {
    const uploader = { upload: vi.fn().mockRejectedValueOnce(new Error("finalize failed")).mockResolvedValue({ video_url: "u" }) };
    const { engine, store } = makeEngine({ uploader });
    const errors = [];
    engine.addEventListener("error", (e) => errors.push(e.detail.code));
    engine.arm();
    await engine.startSegment(1);
    await engine.stopSegment(4);
    await flush();
    expect(engine.segments[0]).toMatchObject({ status: "failed", error: "finalize failed" });
    expect(errors).toContain("upload-failed");
    expect(store.rows.size).toBe(1); // still safe on this device
    expect(engine.hasPendingWork()).toBe(true);
    expect(engine.retry(engine.segments[0].localId)).toBe(true);
    await flush();
    await flush();
    expect(engine.segments[0].status).toBe("saved");
    expect(store.rows.size).toBe(0);
  });

  it("discards empty or too-short segments", async () => {
    const { engine, uploader } = makeEngine();
    engine.arm();
    await engine.startSegment(1);
    FakeRecorder.instances[0].bytes = 0;
    await engine.stopSegment(5);
    await engine.startSegment(6);
    await engine.stopSegment(6.1);
    expect(engine.segments.map((s) => s.status)).toEqual(["discarded", "discarded"]);
    expect(uploader.upload).not.toHaveBeenCalled();
  });

  it("splits at a jump and continues in a new segment", async () => {
    const { engine } = makeEngine();
    engine.arm();
    await engine.startSegment(10);
    await engine.split(14, 60);
    expect(engine.segments).toHaveLength(2);
    expect(engine.segments[0]).toMatchObject({ start: 10, end: 14 });
    expect(engine.segments[1]).toMatchObject({ start: 60, status: "recording" });
    expect(engine.state).toBe("recording");
  });

  it("splits long takes automatically", async () => {
    const { engine } = makeEngine({ maxSegmentSeconds: 30 });
    engine.arm();
    await engine.startSegment(0);
    await engine.tick(10);
    expect(engine.segments).toHaveLength(1);
    await engine.tick(31);
    expect(engine.segments).toHaveLength(2);
    expect(engine.segments[1].start).toBe(31);
  });

  it("waits for a stopping recorder before starting the next segment", async () => {
    const { engine } = makeEngine();
    engine.arm();
    await engine.startSegment(0);
    const stopping = engine.stopSegment(2);
    const starting = engine.startSegment(2.5);
    await Promise.all([stopping, starting]);
    expect(FakeRecorder.instances).toHaveLength(2);
    expect(FakeRecorder.instances[0].state).toBe("inactive");
    expect(engine.segments[1].status).toBe("recording");
  });

  it("disarm ends the segment without waiting for its upload", async () => {
    const gate = deferred();
    const uploader = { upload: vi.fn(() => gate.promise) };
    const { engine } = makeEngine({ uploader });
    engine.arm();
    await engine.startSegment(0);
    await engine.disarm(3);
    expect(engine.state).toBe("ready");
    await flush();
    expect(engine.segments[0].status).toBe("uploading");
    expect(engine.hasPendingWork()).toBe(true);
    gate.resolve({ video_url: "u" });
  });

  it("removes local segments, deletes saved ones on the server, refuses busy ones", async () => {
    const deleteShot = vi.fn(async () => {});
    const gate = deferred();
    const uploader = {
      upload: vi.fn().mockResolvedValueOnce({ video_url: "u" }).mockImplementationOnce(() => gate.promise),
    };
    const { engine } = makeEngine({ deleteShot, uploader });
    engine.arm();
    await engine.startSegment(0);
    await engine.stopSegment(2);
    await flush();
    await engine.startSegment(3);
    await engine.stopSegment(5);
    await flush();
    const [saved, uploading] = engine.segments;
    expect(await engine.remove(uploading.localId)).toBe(false);
    expect(await engine.remove(saved.localId)).toBe(true);
    expect(deleteShot).toHaveBeenCalledWith("100");
    expect(engine.segments).toHaveLength(1);
    gate.resolve({ video_url: "u2" });
  });

  it("restores segments a reload left behind and uploads them", async () => {
    const store = makeStore();
    store.rows.set("7:1:a", { key: "7:1:a", recordingId: "7", shotId: "88", blob: new Blob(["abc"]), mimeType: "video/webm", start: 3, end: 6, jsStart: 1, jsEnd: 2, createdAt: 1 });
    store.rows.set("7:2:b", { key: "7:2:b", recordingId: "7", shotId: null, blob: new Blob(["def"]), mimeType: "video/webm", start: 8, end: 9, jsStart: 3, jsEnd: 4, createdAt: 2 });
    store.rows.set("9:1:c", { key: "9:1:c", recordingId: "9", shotId: "1", blob: new Blob(["x"]), createdAt: 3 });
    const { engine, uploader, openShot } = makeEngine({ store });
    expect(await engine.restorePending()).toBe(2);
    await flush();
    await flush();
    await flush();
    expect(uploader.upload.mock.calls.map((c) => c[0].shotId)).toEqual(["88", "100"]);
    expect(openShot).toHaveBeenCalledTimes(1);
    expect(engine.segments.every((s) => s.status === "saved")).toBe(true);
    expect([...store.rows.keys()]).toEqual(["9:1:c"]);
  });
});

describe("UploadManager", () => {
  function api(overrides = {}) {
    return {
      status: vi.fn(async () => ({ status: "initialized" })),
      init: vi.fn(async () => ({ upload_id: "up-1" })),
      chunk: vi.fn(async (t, id, part, offset, b64, size) => ({ next_expected_offset: offset + size })),
      finalize: vi.fn(async () => ({ ok: true, video_url: "https://v/1.mp4" })),
      abort: vi.fn(async () => ({})),
      ...overrides,
    };
  }

  it("uploads in chunks and finalizes", async () => {
    const a = api();
    const m = new UploadManager({ api: a });
    const progress = [];
    const blob = new Blob([new Uint8Array(2.5 * 1024 * 1024)], { type: "video/webm" });
    const res = await m.upload({ token: "t", shotId: "5", blob, contentType: "video/webm", originalVideoEnd: 9, recordingEnd: 4000, jsEnd: 1, onProgress: (p) => progress.push(p) });
    expect(res.video_url).toBe("https://v/1.mp4");
    expect(a.chunk).toHaveBeenCalledTimes(3);
    expect(a.chunk.mock.calls.map((c) => c[3])).toEqual([0, 1048576, 2097152]);
    expect(a.finalize).toHaveBeenCalledWith("t", "up-1", blob.size, 9, 4000, 1);
    expect(progress.at(-1)).toBe(1);
  });

  it("resumes from the server's byte count", async () => {
    const a = api({
      status: vi.fn(async () => ({ status: "uploading", upload_id: "up-9", upload_parts: { bytes_received: 1048576, parts: [{ size: 1048576 }] } })),
    });
    const m = new UploadManager({ api: a });
    const blob = new Blob([new Uint8Array(1.5 * 1024 * 1024)]);
    await m.upload({ token: "t", shotId: "5", blob, contentType: "video/webm" });
    expect(a.init).not.toHaveBeenCalled();
    expect(a.chunk).toHaveBeenCalledTimes(1);
    expect(a.chunk.mock.calls[0].slice(1, 4)).toEqual(["up-9", 1, 1048576]);
  });

  it("treats an already finalized shot as done", async () => {
    const a = api({ status: vi.fn(async () => ({ status: "complete", storage_key: "k" })) });
    const res = await new UploadManager({ api: a }).upload({ token: "t", shotId: "5", blob: new Blob(["x"]) });
    expect(res.alreadyComplete).toBe(true);
    expect(a.chunk).not.toHaveBeenCalled();
  });

  it("retries a chunk with backoff, then gives up", async () => {
    const a = api({ chunk: vi.fn().mockRejectedValueOnce(new Error("blip")).mockResolvedValueOnce({ next_expected_offset: 1 }) });
    const m = new UploadManager({ api: a });
    m.retryDelayMs = 1;
    await m.upload({ token: "t", shotId: "5", blob: new Blob(["x"]) });
    expect(a.chunk).toHaveBeenCalledTimes(2);
    const failing = api({ chunk: vi.fn().mockRejectedValue(new Error("down")) });
    const m2 = new UploadManager({ api: failing });
    m2.retryDelayMs = 1;
    await expect(m2.upload({ token: "t", shotId: "5", blob: new Blob(["x"]) })).rejects.toThrow("down");
    expect(failing.chunk).toHaveBeenCalledTimes(4);
  });

  it("refuses empty and oversized segments", async () => {
    const m = new UploadManager({ api: api() });
    await expect(m.upload({ token: "t", shotId: "1", blob: new Blob([]) })).rejects.toThrow(/empty/);
    const huge = { size: 201 * 1024 * 1024 };
    await expect(m.upload({ token: "t", shotId: "1", blob: huge })).rejects.toThrow(/200 MB/);
  });
});
