import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

const server = vi.hoisted(() => ({ functions: new Set(), replies: {}, calls: [] }));
vi.mock("../../api/rpc", async () => {
  const actual = await vi.importActual("../../api/rpc");
  return {
    ...actual,
    sessionToken: () => "tok",
    hasRpc: (name) => server.functions.has(name),
    rpc: vi.fn(async (name, args, opts) => {
      server.calls.push({ name, args, opts });
      const reply = server.replies[name];
      if (reply instanceof Error) throw reply;
      const value = typeof reply === "function" ? reply(args) : reply;
      if (!opts?.raw && actual.isFailurePayload(value)) throw new actual.RpcError("server_error", value.error || "failed");
      return value;
    }),
  };
});

import { classicApi } from "../../app/classicApi";
import { recordingsApi } from "./recordingsApi";

function makeStore(username = "ann") {
  return configureStore({
    reducer: { [classicApi.reducerPath]: classicApi.reducer, user: () => ({ username }) },
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(classicApi.middleware),
  });
}

async function run(store, endpoint, arg) {
  const sub = store.dispatch(recordingsApi.endpoints[endpoint].initiate(arg));
  const result = await sub;
  sub.unsubscribe?.();
  return result;
}

beforeEach(() => {
  server.functions = new Set();
  server.replies = {};
  server.calls = [];
});

describe("listRecordings", () => {
  it("uses listVideoRecordings with offsets from the page", async () => {
    server.functions.add("listVideoRecordings");
    server.replies.listVideoRecordings = { ok: true, rows: [{ id: 3, title: "A" }], total: 51 };
    const res = await run(makeStore(), "listRecordings", { scope: "public", search: "x", page: 3, pageSize: 24 });
    expect(server.calls[0].args).toEqual(["tok", "public", "x", 48, 24]);
    expect(res.data.total).toBe(51);
    expect(res.data.rows[0].id).toBe("3");
  });

  it("falls back to the legacy lists and keeps only the right owner", async () => {
    server.replies.getVideoRecordingsICanUse = [[{ id: 1, create_user: "ann" }, { id: 2, create_user: "bob" }], { "count(*)": 2 }];
    const mine = await run(makeStore("ann"), "listRecordings", { scope: "mine", search: "", page: 1, pageSize: 24 });
    expect(mine.data.rows.map((r) => r.id)).toEqual(["1"]);
    const shared = await run(makeStore("ann"), "listRecordings", { scope: "shared", search: "", page: 1, pageSize: 24 });
    expect(shared.data.rows.map((r) => r.id)).toEqual(["2"]);
  });

  it("reports errors as { code, message }", async () => {
    server.functions.add("listVideoRecordings");
    server.replies.listVideoRecordings = { ok: false, error: "db down" };
    const res = await run(makeStore(), "listRecordings", { scope: "mine", search: "", page: 1, pageSize: 24 });
    expect(res.error).toMatchObject({ code: "server_error", message: "db down" });
  });
});

describe("getRecordingDetails", () => {
  it("uses getVideoRecordingDetails and reports not_found", async () => {
    server.functions.add("getVideoRecordingDetails");
    server.replies.getVideoRecordingDetails = (args) =>
      args[1] === 7
        ? { ok: true, video_id: "dQw4w9WgXcQ", recording: { id: 7, title: "T" }, can_edit: true, shots: [], captions: [] }
        : { ok: false, code: "not_found", error: "This recording does not exist or is not shared with you." };
    const store = makeStore();
    const ok = await run(store, "getRecordingDetails", "7");
    expect(ok.data.recording.videoId).toBe("dQw4w9WgXcQ");
    expect(ok.data.canEdit).toBe(true);
    const missing = await run(store, "getRecordingDetails", "8");
    expect(missing.error.code).toBe("not_found");
  });

  it("falls back to getVideoRecording without blobs", async () => {
    server.replies.getVideoRecording = { id: 7, create_user: "ann", original_video_url: "https://youtu.be/dQw4w9WgXcQ", recording_shots: [] };
    const res = await run(makeStore("ann"), "getRecordingDetails", "7");
    expect(server.calls[0].args).toEqual(["tok", 7, false]);
    expect(res.data.canEdit).toBe(true);
    server.replies.getVideoRecording = null;
    const gone = await run(makeStore("ann"), "getRecordingDetails", "9");
    expect(gone.error.code).toBe("not_found");
  });
});

describe("getYouTubeMetadata", () => {
  it("refuses links that aren't YouTube", async () => {
    const res = await run(makeStore(), "getYouTubeMetadata", "https://vimeo.com/1");
    expect(res.error.code).toBe("invalid");
  });

  it("returns unknown embeddability on servers without the check", async () => {
    const res = await run(makeStore(), "getYouTubeMetadata", "https://youtu.be/dQw4w9WgXcQ");
    expect(res.data).toMatchObject({ videoId: "dQw4w9WgXcQ", embeddable: null });
  });

  it("passes the server's verdict through, and treats an unreachable YouTube as unknown", async () => {
    server.functions.add("getYouTubeMetadata");
    server.replies.getYouTubeMetadata = { ok: true, video_id: "dQw4w9WgXcQ", embeddable: false, exists: true, reason: "No embedding" };
    const blocked = await run(makeStore(), "getYouTubeMetadata", "dQw4w9WgXcQ");
    expect(blocked.data).toMatchObject({ embeddable: false, reason: "No embedding" });
    server.replies.getYouTubeMetadata = { ok: false, code: "unreachable", error: "x" };
    const unknown = await run(makeStore(), "getYouTubeMetadata", "aaaaaaaaaaa");
    expect(unknown.data.embeddable).toBeNull();
  });
});

describe("mutations", () => {
  it("creates a recording, then stores YouTube metadata best-effort", async () => {
    server.replies.createVideoRecording = { video_recording_id: 12 };
    server.replies.updateVideoRecording = new Error("socket down");
    const store = makeStore();
    const res = await store.dispatch(
      recordingsApi.endpoints.createRecording.initiate({ title: "Mine", description: "", videoId: "dQw4w9WgXcQ", youtubeTitle: "YT", youtubeAuthor: "A", duration: 60 })
    );
    expect(res.data).toEqual({ id: "12" });
    expect(server.calls.map((c) => c.name)).toEqual(["createVideoRecording", "updateVideoRecording"]);
    expect(server.calls[0].args).toEqual(["tok", "Mine", "", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"]);
  });

  it("saves the author's details with setVideoRecordingDetails when available", async () => {
    server.functions.add("setVideoRecordingDetails");
    server.replies.setVideoRecordingDetails = { ok: true, title: "T", description: "D" };
    const res = await makeStore().dispatch(recordingsApi.endpoints.setRecordingDetails.initiate({ id: "7", title: "T", description: "D" }));
    expect(res.data).toEqual({ title: "T", description: "D" });
    expect(server.calls[0].args).toEqual(["tok", 7, "T", "D"]);
  });

  it("saves captions as server cues and reports adjustments", async () => {
    server.replies.saveRecordingCaptions = { ok: true, track: { language: "en", cues: [{ start_ms: 0, end_ms: 500, text: "a" }] }, adjusted: 2 };
    const res = await makeStore().dispatch(
      recordingsApi.endpoints.saveCaptions.initiate({ recordingId: "7", language: "en", label: "English", cues: [{ id: "x", startMs: 0, endMs: 500, text: "a" }] })
    );
    expect(server.calls[0].args).toEqual(["tok", 7, "en", "English", [{ start_ms: 0, end_ms: 500, text: "a" }]]);
    expect(res.data.adjusted).toBe(2);
    expect(res.data.track.cues[0].text).toBe("a");
  });
});
