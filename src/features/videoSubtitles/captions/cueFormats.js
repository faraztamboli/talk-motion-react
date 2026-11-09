/**
 * Caption file formats for the Subtitle Designer.
 *
 * Editor cue: { id, startMs, endMs, text }   (times on the YouTube video's timeline)
 * Server cue: { start_ms, end_ms, text }     (saveRecordingCaptions / getRecordingCaptions)
 *
 * parseCaptionFile() reads WebVTT and SubRip (.srt); cuesToVtt() / cuesToSrt() write them.
 */
import { newCueId } from "./cueOps";

const pad = (n, w = 2) => String(n).padStart(w, "0");

/**
 * "01:02:03.004", "02:03.004", "01:02:03,004" (SRT), "2:03" -> milliseconds, or NaN.
 */
export function parseTimestamp(value) {
  if (typeof value !== "string") return NaN;
  const m = value.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!m) return NaN;
  const [, h = "0", min, s, frac = "0"] = m;
  if (Number(min) > 59 || Number(s) > 59) return NaN;
  const ms = Number(frac.padEnd(3, "0"));
  return ((Number(h) * 60 + Number(min)) * 60 + Number(s)) * 1000 + ms;
}

/** 3723004 -> "01:02:03.004" (WebVTT) or "01:02:03,004" (SRT). */
export function formatTimestamp(ms, separator = ".") {
  const total = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${separator}${pad(total % 1000, 3)}`;
}

/** 83250 -> "1:23.2" for compact display. */
export function formatClock(ms) {
  const total = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const tenth = Math.floor((total % 1000) / 100);
  return h ? `${h}:${pad(m)}:${pad(s)}.${tenth}` : `${m}:${pad(s)}.${tenth}`;
}

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&quot;": '"', "&#39;": "'", "&lrm;": "", "&rlm;": "" };

/** Strip WebVTT/SRT markup (<c>, <v Name>, <i>, inline timestamps, {\an8}) and decode entities. */
export function cleanCueText(text) {
  return String(text || "")
    .replace(/<\d{2}:\d{2}[:.,\d]*>/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/&(amp|lt|gt|nbsp|quot|#39|lrm|rlm);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

function blocksOf(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.split("\n").filter((line, i, all) => line.trim() !== "" || i < all.length - 1))
    .filter((lines) => lines.some((l) => l.trim()));
}

function parseTimingLine(line) {
  const m = line.match(/^\s*(\S+)\s+-->\s+(\S+)/);
  if (!m) return null;
  return { startMs: parseTimestamp(m[1]), endMs: parseTimestamp(m[2]) };
}

function parseBlocks(blocks, { skipHeader }) {
  const cues = [];
  const errors = [];
  blocks.forEach((lines, index) => {
    const first = lines[0].trim();
    if (skipHeader && (index === 0 && /^WEBVTT\b/.test(first))) return;
    if (/^(NOTE|STYLE|REGION)\b/.test(first)) return;
    const timingIndex = lines.findIndex((l) => l.includes("-->"));
    if (timingIndex < 0 || timingIndex > 1) {
      errors.push(`Block ${index + 1} has no timing line`);
      return;
    }
    const timing = parseTimingLine(lines[timingIndex]);
    if (!timing || !Number.isFinite(timing.startMs) || !Number.isFinite(timing.endMs)) {
      errors.push(`Block ${index + 1} has an unreadable time`);
      return;
    }
    const text = cleanCueText(lines.slice(timingIndex + 1).join("\n"));
    if (!text) return;
    cues.push({ id: newCueId(), startMs: timing.startMs, endMs: Math.max(timing.endMs, timing.startMs + 1), text });
  });
  return { cues: cues.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs), errors };
}

export function parseVtt(text) {
  return parseBlocks(blocksOf(text), { skipHeader: true });
}

export function parseSrt(text) {
  return parseBlocks(blocksOf(text), { skipHeader: false });
}

/** Detects the format by content (a WEBVTT header, or SRT's comma milliseconds) and name. */
export function detectCaptionFormat(text, filename = "") {
  const head = String(text || "").replace(/^\uFEFF/, "").trimStart();
  if (/^WEBVTT\b/.test(head)) return "vtt";
  if (/\.vtt$/i.test(filename)) return "vtt";
  if (/\.srt$/i.test(filename)) return "srt";
  if (/\d{2}:\d{2}:\d{2},\d{1,3}\s+-->/.test(head)) return "srt";
  if (/-->/.test(head)) return "vtt";
  return null;
}

/** { cues, errors, format } from caption file text. */
export function parseCaptionFile(text, filename = "") {
  const format = detectCaptionFormat(text, filename);
  if (!format) return { cues: [], errors: ["This file isn't a WebVTT (.vtt) or SubRip (.srt) caption file."], format: null };
  const parsed = format === "vtt" ? parseVtt(text) : parseSrt(text);
  return { ...parsed, format };
}

export function cuesToVtt(cues) {
  const blocks = (cues || [])
    .filter((c) => c.text && c.text.trim())
    .map((c) => `${formatTimestamp(c.startMs)} --> ${formatTimestamp(c.endMs)}\n${cleanCueText(c.text)}`);
  return `WEBVTT\n\n${blocks.join("\n\n")}${blocks.length ? "\n" : ""}`;
}

export function cuesToSrt(cues) {
  const blocks = (cues || [])
    .filter((c) => c.text && c.text.trim())
    .map((c, i) => `${i + 1}\n${formatTimestamp(c.startMs, ",")} --> ${formatTimestamp(c.endMs, ",")}\n${cleanCueText(c.text)}`);
  return blocks.join("\n\n") + (blocks.length ? "\n" : "");
}

/** Server cues -> editor cues (with fresh ids). */
export function fromServerCues(serverCues) {
  if (!Array.isArray(serverCues)) return [];
  return serverCues
    .map((c) => ({
      id: newCueId(),
      startMs: Math.round(Number(c?.start_ms ?? c?.startMs)),
      endMs: Math.round(Number(c?.end_ms ?? c?.endMs)),
      text: typeof c?.text === "string" ? c.text : "",
    }))
    .filter((c) => Number.isFinite(c.startMs) && Number.isFinite(c.endMs) && c.text.trim())
    .sort((a, b) => a.startMs - b.startMs);
}

/** Editor cues -> server cues. */
export function toServerCues(cues) {
  return (cues || []).map((c) => ({ start_ms: Math.round(c.startMs), end_ms: Math.round(c.endMs), text: c.text }));
}
