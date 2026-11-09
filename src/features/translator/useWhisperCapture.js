import { useCallback, useEffect, useRef, useState } from "react";
import { micErrorCode } from "./speechErrors";

const MIN_SPEECH_RMS = 0.02; // never treat quieter than this as speech
const NOISE_FACTOR = 3; // speech is this many times louder than the room's noise floor
const SILENCE_MS = 900; // quiet after speech = utterance over
const MAX_UTTERANCE_MS = 15000; // cut very long utterances
const IDLE_RECYCLE_MS = 10000; // nothing said: restart the recorder, drop the audio
const MONITOR_MS = 100;
const MIN_BLOB_BYTES = 1000;

export function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // keep looking
    }
  }
  return "";
}

export const whisperSupported = () =>
  typeof MediaRecorder !== "undefined" && Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);

/**
 * Microphone capture for server transcription: records with MediaRecorder, finds utterances
 * from the input level (speech, then ~0.9 s of quiet), and hands each one to onUtterance(blob).
 * While `suspended` (text-to-speech is talking) audio is thrown away so the translator doesn't
 * transcribe itself. start() rejects with an Error whose .code is mic-denied | mic-missing |
 * mic-failed | unsupported.
 */
export default function useWhisperCapture({ onUtterance, suspended = false }) {
  const [active, setActive] = useState(false);
  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;

  const s = useRef({
    stream: null,
    ctx: null,
    analyser: null,
    recorder: null,
    chunks: [],
    monitor: null,
    hadSpeech: false,
    lastVoiceAt: 0,
    startedAt: 0,
    discardNext: false,
    active: false,
    mime: null,
    noise: 0.01,
  }).current;

  const rms = () => {
    if (!s.analyser) return 0;
    const data = new Uint8Array(s.analyser.fftSize);
    s.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  };

  const begin = () => {
    if (!s.active || !s.stream || suspendedRef.current) return;
    s.chunks = [];
    s.hadSpeech = false;
    s.startedAt = Date.now();
    s.lastVoiceAt = Date.now();
    const recorder = new MediaRecorder(s.stream, s.mime ? { mimeType: s.mime } : undefined);
    s.recorder = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) s.chunks.push(e.data);
    };
    recorder.onstop = () => {
      const keep = !s.discardNext && s.hadSpeech;
      s.discardNext = false;
      const chunks = s.chunks;
      s.chunks = [];
      s.recorder = null;
      if (keep) {
        const blob = new Blob(chunks, { type: s.mime || "audio/webm" });
        if (blob.size >= MIN_BLOB_BYTES) onUtteranceRef.current?.(blob);
      }
      begin(); // keep listening (unless stopped or suspended)
    };
    recorder.start(250);
  };

  const tick = () => {
    const recorder = s.recorder;
    if (suspendedRef.current) {
      // TTS is speaking: drop what the mic hears; begin() waits until it's quiet again.
      if (recorder && recorder.state === "recording") {
        s.discardNext = true;
        recorder.stop();
      }
      return;
    }
    if (!recorder) {
      begin();
      return;
    }
    if (recorder.state !== "recording") return;
    const now = Date.now();
    const level = rms();
    const threshold = Math.max(MIN_SPEECH_RMS, s.noise * NOISE_FACTOR);
    if (level > threshold) {
      s.hadSpeech = true;
      s.lastVoiceAt = now;
    } else {
      s.noise = s.noise * 0.98 + level * 0.02; // follow the room's background level
    }
    const age = now - s.startedAt;
    if (s.hadSpeech) {
      if (now - s.lastVoiceAt > SILENCE_MS || age > MAX_UTTERANCE_MS) recorder.stop();
    } else if (age > IDLE_RECYCLE_MS) {
      s.discardNext = true;
      recorder.stop();
    }
  };

  const release = useCallback(() => {
    s.active = false;
    clearInterval(s.monitor);
    s.monitor = null;
    const recorder = s.recorder;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.stop(); // onstop sends a final utterance that had speech
      } catch {
        // already stopped
      }
    }
    s.stream?.getTracks().forEach((t) => t.stop());
    s.stream = null;
    s.ctx?.close?.().catch(() => {});
    s.ctx = null;
    s.analyser = null;
    setActive(false);
  }, [s]);

  const start = useCallback(async () => {
    if (s.active) return;
    if (!whisperSupported()) throw Object.assign(new Error("unsupported"), { code: "unsupported" });
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      throw Object.assign(new Error(err?.message || "microphone"), { code: micErrorCode(err) });
    }
    s.stream = stream;
    s.mime = pickMimeType();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      s.ctx = ctx;
      try {
        if (ctx.state === "suspended") await ctx.resume(); // Safari starts suspended
      } catch {
        // level detection may be deaf; utterances are then cut at the max length
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      s.analyser = analyser;
    }
    s.noise = 0.01;
    s.active = true;
    setActive(true);
    begin();
    s.monitor = setInterval(tick, MONITOR_MS);
  }, [s]);

  useEffect(() => () => release(), [release]);

  return { start, stop: release, active };
}
