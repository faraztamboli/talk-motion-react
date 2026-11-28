// Mock RemotePy server for an end-to-end test of the Subtitle Designer and viewer.
//
// Speaks the same protocol as production (JSON {funcName, args, session_id} in; {funcName,
// return|error} out), offers the live server's exact function library (library.json, taken from
// the 0.0.6-classic startup log; see README.md to refresh it), and mirrors TalkMotionServer.py for the recording functions:
// create does not set the YouTube title, owner checks, shot registration, resumable chunked
// upload, EBML/MP4 header check, details/list shapes, captions. Like 0.0.7-classic, finalize
// returns at once with status "processing" and the conversion to <shot>_sl_webm.mp4 (same
// ffmpeg arguments as production) runs in the background; init/finalize/status report an
// already-uploaded segment instead of failing. Converted files are served over HTTP with
// Range support. CONVERSION_DELAY_MS (default 1500) holds each conversion back so the
// "Preparing video" state is visible.
//
// LEGACY_OWNER_CHECK=1 reproduces the pre-fix bug: a recording only counts as yours when its
// original_video_title or original_video_author is not NULL.
//
// Usage: node mock-server.mjs <port> <dataDir>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { WebSocketServer } = require("ws");

const PORT = Number(process.argv[2] || 8792);
const DATA = path.resolve(process.argv[3] || "./data");
const LEGACY = process.env.LEGACY_OWNER_CHECK === "1";
const CONVERSION_DELAY_MS = Number(process.env.CONVERSION_DELAY_MS ?? 1500);
// Production on 2026-11-27: the reply to finalize never arrived (the server froze, the socket
// dropped). DROP_FIRST_FINALIZE_REPLY=1 does the work, then drops the connection instead of
// replying, once; the page must still end up showing the take as saved.
let dropFinalizeReply = process.env.DROP_FIRST_FINALIZE_REPLY === "1";
const LIBRARY = JSON.parse(fs.readFileSync(new URL("./library.json", import.meta.url)));
const UPLOADS = path.join(DATA, "uploads");
const MEDIA = path.join(DATA, "media", "subtitles");
fs.mkdirSync(UPLOADS, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });
const CALLS = path.join(DATA, "calls.jsonl");
fs.writeFileSync(CALLS, "");

const USERS = {
  "tok-signer": { username: "signer", first: "Sam", fullname: "Sam Signer" },
  "tok-other": { username: "other", first: "Olu", fullname: "Olu Other" },
};
const db = { recordings: new Map(), shots: new Map(), captions: new Map(), nextRec: 500, nextShot: 9000 };
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const userOf = (sid) => USERS[sid] || null;

class ServerError extends Error {}

function ownerCheck(user, recordingId) {
  const rec = db.recordings.get(Number(recordingId));
  const mine = rec && user && rec.create_user === user.username;
  const legacyVisible = rec && (rec.original_video_title != null || rec.original_video_author != null);
  if (!mine || (LEGACY && !legacyVisible)) throw new ServerError("Sorry, this video recording doesn't belong to you!");
  return rec;
}

function access(rec, user) {
  if (!rec) return null;
  if (user && rec.create_user === user.username) return "owner";
  if (rec.is_public) return "public";
  return null;
}

const videoId = (url) => (String(url || "").match(/[?&]v=([\w-]{11})/) || [])[1] || null;

function detectContainer(buf) {
  if (buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "webm";
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
  return null;
}

const shotRow = (s) => ({
  id: s.id, original_video_start: s.original_video_start, original_video_end: s.original_video_end,
  status: s.status, video_url: s.video_url, content_type: s.content_type, error_message: s.error_message,
  create_time: s.create_time, js_start: s.js_start, js_end: s.js_end,
});

const H = {
  "SessionServer.startSessionIfNotStarted": () => null,
  "SessionServer.getNewSessionId": () => "tok-new",
  "SessionServer.isLoggedIn": ({ sessionid }) => {
    const u = userOf(sessionid);
    return u ? { isLoggedIn: true, isCompanyCreated: false, user: { username: u.username, first: u.first, email: `${u.username}@example.test` } }
             : { isLoggedIn: false };
  },

  "TalkMotionServer.getYouTubeMetadata": ({ url }) => ({
    ok: true, video_id: url, watch_url: `https://www.youtube.com/watch?v=${url}`, title: "Test lecture",
    author: "Test channel", thumbnail_url: `https://i.ytimg.com/vi/${url}/hqdefault.jpg`, exists: true, embeddable: true,
  }),

  "TalkMotionServer.createVideoRecording": ({ sessionid, title, description, original_video_url }) => {
    const u = userOf(sessionid);
    const id = db.nextRec++;
    // Like production: the YouTube title/author/duration are NOT set here.
    db.recordings.set(id, { id, title, description, create_user: u?.username ?? null, original_video_url,
      original_video_title: null, original_video_author: null, original_video_duration: null, is_public: 0,
      product_id: null, create_time: now(), update_time: now() });
    return { username: u?.username, title, description, video_recording_id: id, status: "Initialized",
      operation_status: "recording created successfully" };
  },

  "TalkMotionServer.updateVideoRecording": (a) => {
    try {
      const rec = ownerCheck(userOf(a.sessionid), a.video_recording_id);
      for (const k of ["original_video_title", "original_video_author", "original_video_duration"]) if (a[k] != null) rec[k] = a[k];
      rec.update_time = now();
      return { video_recording_id: rec.id, original_video_title: rec.original_video_title, operation_status: "recording updated successfully" };
    } catch (ex) {
      return { operation_status: "Could not close video recording", error: ex.message };
    }
  },

  "TalkMotionServer.getVideoRecordingDetails": ({ sessionid, recording_id }) => {
    const user = userOf(sessionid);
    const rec = db.recordings.get(Number(recording_id));
    const acc = access(rec, user);
    if (!acc) return { ok: false, code: "not_found", error: "This recording does not exist or is not shared with you." };
    const shots = [...db.shots.values()].filter((s) => s.video_recording_id === rec.id)
      .sort((x, y) => x.original_video_start - y.original_video_start || x.id - y.id).map(shotRow);
    const u = Object.values(USERS).find((x) => x.username === rec.create_user);
    return { ok: true, recording: { ...rec, is_public: Boolean(rec.is_public) }, video_id: videoId(rec.original_video_url),
      access: acc, can_edit: acc === "owner", creator: { username: rec.create_user, fullname: u?.fullname ?? null, sm_img: null },
      shots, captions: captionTracks(rec.id), captions_available: true };
  },

  "TalkMotionServer.listVideoRecordings": ({ sessionid, scope, offset = 0, limit = 24 }) => {
    const user = userOf(sessionid);
    if (!user) return { ok: false, error: "User not authenticated" };
    const rows = [...db.recordings.values()].filter((r) => (scope === "public" ? r.is_public : r.create_user === user.username))
      .map((r) => ({ ...r, shot_count: [...db.shots.values()].filter((s) => s.video_recording_id === r.id).length, caption_count: 0 }));
    return { ok: true, scope, rows: rows.slice(offset, offset + limit), total: rows.length };
  },

  "TalkMotionServer.setVideoRecordingDetails": (a) => {
    const rec = ownerCheck(userOf(a.sessionid), a.video_recording_id);
    if (a.title != null) rec.title = a.title;
    if (a.description != null) rec.description = a.description;
    return { ok: true, title: rec.title, description: rec.description };
  },

  "TalkMotionServer.updateVideoRecordingPrivacy": (a) => {
    const rec = ownerCheck(userOf(a.sessionid), a.video_recording_id);
    rec.is_public = a.is_public ? 1 : 0;
    return { video_recording_id: rec.id, is_public: rec.is_public, operation_status: "privacy updated" };
  },

  "TalkMotionServer.openVideoRecordingShot": (a) => {
    const user = userOf(a.sessionid);
    try {
      ownerCheck(user, a.video_recording_id);
      const id = db.nextShot++;
      db.shots.set(id, { id, video_recording_id: Number(a.video_recording_id), create_user: user.username,
        original_video_start: a.original_video_start, original_video_end: null, recording_start: a.recording_start,
        js_start: a.js_start, js_end: null, status: "initialized", upload_id: null, upload_parts: null, size_bytes: null,
        checksum: null, content_type: null, video_url: null, error_message: null, create_time: now() });
      return { username: user.username, video_recording_shot_id: id, video_recording_id: a.video_recording_id,
        status: "Initialized", operation_status: "recording shot created successfully" };
    } catch (ex) {
      return { operation_status: "Could not open video recording shot", error: ex.message };
    }
  },

  "TalkMotionServer.getVideoRecordingShotUploadStatus": ({ sessionid, video_recording_shot_id }) => {
    const s = db.shots.get(Number(video_recording_shot_id));
    if (!s || s.create_user !== userOf(sessionid)?.username) return { ok: false, error: "Video recording shot not found" };
    return { ok: true, shot_id: s.id, status: s.status, upload_id: s.upload_id, upload_parts: s.upload_parts,
      size_bytes: s.size_bytes, content_type: s.content_type, storage_key: s.storage_key ?? null,
      video_url: s.status === "complete" ? s.video_url : null, error_message: s.error_message };
  },

  "TalkMotionServer.initVideoRecordingShotUpload": (a) => {
    const s = db.shots.get(Number(a.video_recording_shot_id));
    if (!s || s.create_user !== userOf(a.sessionid)?.username) return { ok: false, error: "Video recording shot does not belong to current user" };
    if (s.status === "complete" || s.status === "processing") {
      return { ok: true, shot_id: s.id, status: s.status, upload_id: s.upload_id, already_uploaded: true,
        video_url: s.status === "complete" ? s.video_url : null };
    }
    Object.assign(s, { status: "uploading", upload_id: crypto.randomUUID(), content_type: a.content_type,
      size_bytes: a.total_size_bytes, checksum: a.checksum_sha256, upload_parts: { parts: [], bytes_received: 0 } });
    return { upload_id: s.upload_id, shot_id: s.id, status: "uploading", content_type: a.content_type, total_size_bytes: a.total_size_bytes };
  },

  "TalkMotionServer.uploadVideoRecordingShotChunk": (a) => {
    const s = [...db.shots.values()].find((x) => x.upload_id === a.upload_id);
    if (!s) return { ok: false, error: `Upload ${a.upload_id} not found` };
    if (s.status === "processing") return { ok: false, error: "This segment is already uploaded" };
    if (s.status !== "uploading") return { ok: false, error: `Upload is not in 'uploading' status (current: ${s.status})` };
    const bytes = Buffer.from(a.chunk_base64, "base64");
    if (bytes.length !== a.chunk_size) return { ok: false, error: `Chunk size mismatch: expected ${a.chunk_size}, got ${bytes.length}` };
    const part = path.join(UPLOADS, `${s.id}.part`);
    if (!fs.existsSync(part)) fs.writeFileSync(part, Buffer.alloc(0));
    const fd = fs.openSync(part, "r+");
    fs.writeSync(fd, bytes, 0, bytes.length, a.byte_offset);
    fs.closeSync(fd);
    const parts = s.upload_parts.parts.filter((p) => p.part_index !== a.part_index);
    parts.push({ part_index: a.part_index, byte_offset: a.byte_offset, size: a.chunk_size });
    const received = Math.max(...parts.map((p) => p.byte_offset + p.size));
    s.upload_parts = { parts, bytes_received: received };
    return { ok: true, upload_id: a.upload_id, received_bytes: received, next_expected_offset: received };
  },

  "TalkMotionServer.finalizeVideoRecordingShotUpload": (a) => {
    const s = [...db.shots.values()].find((x) => x.upload_id === a.upload_id);
    if (!s) return { ok: false, error: `Upload ${a.upload_id} not found` };
    if (s.status === "processing" || s.status === "complete") {
      return { ok: true, upload_id: a.upload_id, shot_id: s.id, status: s.status, video_url: s.status === "complete" ? s.video_url : null };
    }
    const part = path.join(UPLOADS, `${s.id}.part`);
    const buf = fs.readFileSync(part);
    if (s.size_bytes && buf.length !== s.size_bytes) return { ok: false, error: `File size mismatch: expected ${s.size_bytes}, got ${buf.length}` };
    const container = detectContainer(buf.subarray(0, 12));
    if (!container) { s.status = "failed"; return { ok: false, error: "The segment is not a WebM or MP4 video" }; }
    const sha = crypto.createHash("sha256").update(buf).digest("hex");
    if (s.checksum && sha !== s.checksum) { s.status = "failed"; return { ok: false, error: "Checksum mismatch" }; }
    const source = path.join(UPLOADS, `${s.id}.${container}`);
    fs.renameSync(part, source);
    Object.assign(s, { status: "processing", storage_key: `uploads/${s.create_user}/${s.video_recording_id}/${s.id}.${container}`,
      size_bytes: buf.length, original_video_end: a.original_video_end ?? s.original_video_end,
      recording_end: a.recording_end, js_end: a.js_end, video_url: null, error_message: null });
    setTimeout(() => convert(s, source, container), CONVERSION_DELAY_MS);
    return { ok: true, upload_id: a.upload_id, shot_id: s.id, status: "processing", video_url: null, storage_key: s.storage_key,
      size_bytes: buf.length, checksum_sha256: sha };
  },

  "TalkMotionServer.saveRecordingCaptions": ({ sessionid, recording_id, language, label, cues }) => {
    const rec = db.recordings.get(Number(recording_id));
    if (!rec) return { ok: false, code: "not_found", error: "Recording not found" };
    if (rec.create_user !== userOf(sessionid)?.username) return { ok: false, code: "forbidden", error: "Only the recording's owner can edit its captions" };
    const kept = (cues || []).filter((c) => String(c.text || "").trim()).sort((x, y) => x.start_ms - y.start_ms);
    const tracks = db.captions.get(rec.id) || {};
    tracks[language] = { id: `${rec.id}-${language}`, video_recording_id: rec.id, language, label: label || language, cues: kept,
      update_user: rec.create_user, update_time: now() };
    db.captions.set(rec.id, tracks);
    return { ok: true, recording_id: rec.id, track: tracks[language], adjusted: (cues || []).length - kept.length };
  },

  "TalkMotionServer.deleteRecordingCaptions": ({ sessionid, recording_id, language }) => {
    const rec = db.recordings.get(Number(recording_id));
    if (!rec || rec.create_user !== userOf(sessionid)?.username) return { ok: false, code: "forbidden", error: "Only the owner can delete captions" };
    const tracks = db.captions.get(rec.id) || {};
    delete tracks[language];
    return { ok: true };
  },

  "TalkMotionServer.deleteVideoRecordingShot": ({ sessionid, video_recording_shot_id }) => {
    const s = db.shots.get(Number(video_recording_shot_id));
    if (!s) return { ok: false, code: "not_found", error: "Segment not found" };
    if (s.create_user !== userOf(sessionid)?.username) return { ok: false, code: "forbidden", error: "Only the owner can delete it" };
    db.shots.delete(s.id);
    return { ok: true, shot_id: s.id, video_recording_id: s.video_recording_id };
  },

  "TalkMotionServer.getRecordingCaptions": () => ({ ok: true, tracks: [], available: true }),
};

function captionTracks(recordingId) {
  return Object.values(db.captions.get(recordingId) || {});
}

/** Background conversion, as in TalkMotionServer._run_segment_conversion (no `nice` on Windows). */
function convert(s, source, container) {
  const out = path.join(MEDIA, `${s.id}_sl_webm.mp4`);
  const partial = `${out}.part.mp4`;
  const args = ["-y", "-loglevel", "error", "-nostdin", ...(container === "webm" ? ["-f", "webm"] : []), "-i", source,
    "-vf", "fps=fps=25:round=up,scale=-2:'trunc(min(720,ih)/2)*2'", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
    "-threads", "2", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", partial];
  execFile(process.env.FFMPEG || "ffmpeg", args, (err) => {
    if (!db.shots.has(s.id)) return; // deleted meanwhile
    if (err) {
      Object.assign(s, { status: "failed", error_message: `The video couldn't be prepared for playback: ${String(err.message).slice(0, 200)}` });
      return;
    }
    fs.renameSync(partial, out);
    Object.assign(s, { status: "complete", video_url: `http://localhost:${PORT}/subtitles/${s.id}_sl_webm.mp4` });
    log({ converted: s.id });
  });
}

function log(entry) {
  fs.appendFileSync(CALLS, JSON.stringify({ t: Date.now(), ...entry }) + "\n");
}

const brief = (v) => {
  const s = JSON.stringify(v ?? null);
  return s.length > 300 ? s.slice(0, 300) + "…" : s;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/state") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ recordings: [...db.recordings.values()], shots: [...db.shots.values()].map(({ upload_parts, ...s }) => s),
      captions: Object.fromEntries([...db.captions.entries()].map(([id, tracks]) => [id, tracks])) }));
    return;
  }
  const m = url.pathname.match(/^\/subtitles\/([\w.-]+\.mp4)$/);
  const file = m && path.join(MEDIA, m[1]);
  if (!file || !fs.existsSync(file)) { res.statusCode = 404; res.end(); return; }
  const size = fs.statSync(file).size;
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("accept-ranges", "bytes");
  res.setHeader("content-type", "video/mp4");
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.setHeader("content-length", size);
    fs.createReadStream(file).pipe(res);
  }
  log({ http: url.pathname, range: req.headers.range || null });
});

const wss = new WebSocketServer({ server, path: "/wss" });
wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    const { funcName, args = {} } = msg;
    let reply;
    if (funcName === "getPythonFunctionLibrary") reply = { funcName, return: LIBRARY };
    else if (H[funcName]) {
      try { reply = { funcName, return: H[funcName](args) }; }
      catch (ex) { reply = { funcName, error: ex.message }; }
    } else reply = { funcName, return: null }; // not used by the designer or viewer
    const shown = { ...args };
    if (shown.chunk_base64) shown.chunk_base64 = `<${shown.chunk_base64.length} b64 chars>`;
    log({ fn: funcName, handled: Boolean(H[funcName]) || funcName === "getPythonFunctionLibrary", args: shown,
      ret: funcName === "getPythonFunctionLibrary" ? "<library>" : brief(reply.return ?? reply.error) });
    if (dropFinalizeReply && funcName === "TalkMotionServer.finalizeVideoRecordingShotUpload") {
      dropFinalizeReply = false;
      log({ dropped: funcName });
      socket.terminate();
      return;
    }
    socket.send(JSON.stringify(reply));
  });
});

server.listen(PORT, () => console.log(`mock RemotePy on ws://localhost:${PORT}/wss (legacy owner check: ${LEGACY})`));
