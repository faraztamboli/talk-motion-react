import { useState, useRef, useEffect, useCallback } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

// Utterance segmentation tuning
const RMS_SPEECH_THRESHOLD = 0.02; // normalized mic level that counts as speech
const SILENCE_MS = 900; // this much quiet after speech = utterance over
const MAX_UTTERANCE_MS = 15000; // force a cut on very long utterances
const IDLE_RECYCLE_MS = 10000; // no speech at all: restart recorder, drop buffer
const MONITOR_INTERVAL_MS = 100;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return ""; // let the browser pick its default
}

/**
 * Whisper-based speech capture: records mic audio with MediaRecorder,
 * detects utterance boundaries from mic level (speech then ~900ms silence),
 * and sends each utterance to the server's transcribeAudio endpoint.
 * Works in every browser with MediaRecorder — including Safari, which has
 * no Web Speech API.
 */
function useWhisperVoice({ onTranscript, language = "en" }) {
  const [token] = useLocalStorage("token");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const monitorRef = useRef(null);
  const hadSpeechRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const utteranceStartRef = useRef(0);
  const discardNextStopRef = useRef(false);
  const activeRef = useRef(false);
  const mimeTypeRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    return () => stopInternal();
  }, []);

  const sendUtterance = useCallback(
    (blob) => {
      if (!blob || blob.size < 1000) return; // too short to contain speech
      setIsTranscribing(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result || "";
        const base64 = String(dataUrl).split(",")[1];
        if (!base64) {
          setIsTranscribing(false);
          return;
        }
        try {
          JS2Py.PythonFunctions.TalkMotionServer.transcribeAudio(
            token,
            base64,
            blob.type || mimeTypeRef.current || "audio/webm",
            language,
            function (res) {
              setIsTranscribing(false);
              if (res && res.text && res.text.trim()) {
                onTranscriptRef.current(res.text.trim().toLowerCase());
              } else if (res && res.error === "not_configured") {
                console.warn("Whisper not configured on server");
              }
            }
          );
        } catch (err) {
          setIsTranscribing(false);
          console.error("transcribeAudio failed:", err);
        }
      };
      reader.readAsDataURL(blob);
    },
    [token, language]
  );

  function beginUtterance() {
    if (!activeRef.current || !streamRef.current) return;
    chunksRef.current = [];
    hadSpeechRef.current = false;
    utteranceStartRef.current = Date.now();
    lastVoiceAtRef.current = Date.now();
    const options = mimeTypeRef.current ? { mimeType: mimeTypeRef.current } : undefined;
    const recorder = new MediaRecorder(streamRef.current, options);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const discard = discardNextStopRef.current || !hadSpeechRef.current;
      discardNextStopRef.current = false;
      if (!discard) {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        sendUtterance(blob);
      }
      chunksRef.current = [];
      beginUtterance(); // keep listening for the next utterance
    };
    recorder.start(250);
  }

  function currentRms() {
    const analyser = analyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  }

  function monitor() {
    const now = Date.now();
    const rms = currentRms();
    if (rms > RMS_SPEECH_THRESHOLD) {
      hadSpeechRef.current = true;
      lastVoiceAtRef.current = now;
    }
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    const utteranceAge = now - utteranceStartRef.current;
    if (hadSpeechRef.current) {
      if (now - lastVoiceAtRef.current > SILENCE_MS || utteranceAge > MAX_UTTERANCE_MS) {
        recorder.stop(); // onstop sends and restarts
      }
    } else if (utteranceAge > IDLE_RECYCLE_MS) {
      discardNextStopRef.current = true;
      recorder.stop(); // recycle the buffer without sending silence
    }
  }

  const start = useCallback(async () => {
    if (activeRef.current) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) {
      throw new Error("MediaRecorder not supported in this browser");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    mimeTypeRef.current = pickMimeType();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;
    activeRef.current = true;
    setIsListening(true);
    beginUtterance();
    monitorRef.current = setInterval(monitor, MONITOR_INTERVAL_MS);
  }, []);

  function stopInternal() {
    activeRef.current = false;
    clearInterval(monitorRef.current);
    monitorRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      // let a final utterance with speech go through; discard pure silence
      recorder.onstop = () => {
        if (hadSpeechRef.current && !discardNextStopRef.current) {
          const blob = new Blob(chunksRef.current, {
            type: mimeTypeRef.current || "audio/webm",
          });
          sendUtterance(blob);
        }
        chunksRef.current = [];
      };
      try {
        recorder.stop();
      } catch (e) {
        // already stopped
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
  }

  const stop = useCallback(() => stopInternal(), []);

  return { start, stop, isListening, isTranscribing };
}

export default useWhisperVoice;
