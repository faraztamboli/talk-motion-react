import { useCallback, useEffect, useRef, useState } from "react";
import { hasRpc, rpc, sessionToken } from "../../api/rpc";
import useWhisperCapture, { whisperSupported } from "./useWhisperCapture";
import { describeWebSpeechError, describeWhisperError } from "./speechErrors";

const RecognitionClass = () =>
  typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const webSpeechSupported = () => Boolean(RecognitionClass());

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const NONE_AVAILABLE =
  "Speech recognition isn't available in this browser. Use Chrome, Edge or Safari, or ask your administrator to turn on server speech recognition.";
const MAX_RESTARTS = 6; // browser engine restarts within RESTART_WINDOW_MS before giving up
const RESTART_WINDOW_MS = 15000;

/**
 * Speech -> text for the Translator.
 *
 * Engines: "whisper" (server transcription; accurate, works in every browser with
 * MediaRecorder) when the server offers it, otherwise "webspeech" (the browser's own
 * recognition, Chrome/Edge/Safari). When one fails the other takes over and `notice` says so;
 * when nothing works `error` says why. While `suspended` (text-to-speech is talking) nothing is
 * captured. onFinal(text) gets each finished sentence.
 *
 * status: idle | starting | listening | paused (suspended while listening)
 */
export default function useSpeechInput({ language = "en-US", onFinal, suspended = false }) {
  const [status, setStatus] = useState("idle");
  const [engine, setEngine] = useState(null);
  const [interim, setInterim] = useState("");
  const [transcribing, setTranscribing] = useState(0);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const wantRef = useRef(false); // the user wants to be listening
  const engineRef = useRef(null);
  const recRef = useRef(null);
  const restartsRef = useRef([]);
  const failuresRef = useRef(0);
  const serverWhisperRef = useRef(null);
  const languageRef = useRef(language);
  languageRef.current = language;
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;
  const mountedRef = useRef(true);

  const setEngineBoth = (e) => {
    engineRef.current = e;
    setEngine(e);
  };

  const fail = useCallback((message) => {
    wantRef.current = false;
    setError(message);
    setInterim("");
    setStatus("idle");
  }, []);

  // ---- browser engine ------------------------------------------------------------
  const stopWebSpeech = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    rec.onend = null;
    rec.onerror = null;
    rec.onresult = null;
    try {
      rec.abort();
    } catch {
      // already stopped
    }
  }, []);

  const startWebSpeechRef = useRef(() => {});
  const switchToWhisperRef = useRef(() => false);

  const startWebSpeech = useCallback(() => {
    const Cls = RecognitionClass();
    if (!Cls) return false;
    stopWebSpeech();
    let rec;
    try {
      rec = new Cls();
    } catch {
      return false;
    }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = languageRef.current;
    rec.onresult = (event) => {
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          const clean = text.trim();
          if (clean) onFinalRef.current?.(clean);
        } else partial += text;
      }
      setInterim(partial.trim());
    };
    rec.onerror = (event) => {
      const d = describeWebSpeechError(event?.error);
      if (d.action === "ignore") return;
      if (d.action === "fallback" && switchToWhisperRef.current(d.message)) return;
      stopWebSpeech();
      fail(d.message || NONE_AVAILABLE);
    };
    rec.onend = () => {
      // Chrome ends recognition on its own after silence; keep going while wanted.
      if (!wantRef.current || suspendedRef.current || engineRef.current !== "webspeech" || recRef.current !== rec) return;
      const now = Date.now();
      restartsRef.current = restartsRef.current.filter((t) => now - t < RESTART_WINDOW_MS);
      restartsRef.current.push(now);
      if (restartsRef.current.length > MAX_RESTARTS) {
        stopWebSpeech();
        fail("Speech recognition keeps stopping. Check your microphone, then press Speak again.");
        return;
      }
      try {
        rec.start();
      } catch {
        startWebSpeechRef.current();
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      return false;
    }
    return true;
  }, [fail, stopWebSpeech]);
  startWebSpeechRef.current = startWebSpeech;

  // ---- server engine -------------------------------------------------------------
  const switchToWebSpeech = useCallback(
    (reason) => {
      if (!webSpeechSupported()) return false;
      whisperRef.current?.stop();
      setEngineBoth("webspeech");
      setNotice(`${reason ? `${reason} ` : ""}Using your browser's speech recognition instead.`);
      if (wantRef.current && !suspendedRef.current) startWebSpeech();
      return true;
    },
    [startWebSpeech]
  );

  const handleUtterance = useCallback(
    async (blob) => {
      if (engineRef.current !== "whisper") return;
      setTranscribing((n) => n + 1);
      try {
        const base64 = await blobToBase64(blob);
        const res = await rpc(
          "transcribeAudio",
          [sessionToken(), base64, blob.type || "audio/webm", languageRef.current.split("-")[0]],
          { raw: true }
        );
        if (typeof res?.text === "string" && res.text.trim()) {
          failuresRef.current = 0;
          onFinalRef.current?.(res.text.trim());
          return;
        }
        const d = describeWhisperError(res?.error);
        if (d.action === "ignore") {
          if (d.message) setNotice(d.message);
          return;
        }
        throw Object.assign(new Error(d.message), { described: d });
      } catch (err) {
        const d = err?.described || describeWhisperError("transcription_failed");
        failuresRef.current += 1;
        if (switchToWebSpeech(d.message)) return;
        if (failuresRef.current >= 3 || d.action === "stop") {
          whisperRef.current?.stop();
          fail(d.message);
        } else if (mountedRef.current) setNotice(`${d.message} Keep talking; we'll try again.`);
      } finally {
        if (mountedRef.current) setTranscribing((n) => Math.max(0, n - 1));
      }
    },
    [fail, switchToWebSpeech]
  );

  const whisper = useWhisperCapture({ onUtterance: handleUtterance, suspended });
  const whisperRef = useRef(whisper);
  whisperRef.current = whisper;

  switchToWhisperRef.current = (reason) => {
    if (engineRef.current === "whisper" || !serverWhisperRef.current || !whisperSupported()) return false;
    stopWebSpeech();
    setEngineBoth("whisper");
    setNotice(`${reason ? `${reason} ` : ""}Using server speech recognition instead.`);
    whisperRef.current.start().catch((err) => fail(describeWhisperError(err?.code).message));
    return true;
  };

  const serverHasWhisper = useCallback(async () => {
    if (serverWhisperRef.current !== null) return serverWhisperRef.current;
    let ok = false;
    if (hasRpc("getSpeechCapabilities") && hasRpc("transcribeAudio")) {
      try {
        const res = await rpc("getSpeechCapabilities", [sessionToken()], { raw: true, timeoutMs: 8000 });
        ok = Boolean(res?.whisper);
      } catch {
        ok = false;
      }
    }
    serverWhisperRef.current = ok;
    return ok;
  }, []);

  // ---- controls --------------------------------------------------------------------
  const start = useCallback(async () => {
    if (wantRef.current) return;
    wantRef.current = true;
    setError(null);
    setNotice(null);
    setInterim("");
    failuresRef.current = 0;
    restartsRef.current = [];
    setStatus("starting");
    const useWhisper = whisperSupported() && (await serverHasWhisper());
    if (!wantRef.current) return; // stopped meanwhile
    if (useWhisper) {
      setEngineBoth("whisper");
      try {
        await whisperRef.current.start();
        if (wantRef.current) setStatus("listening");
        else whisperRef.current.stop();
        return;
      } catch (err) {
        const d = describeWhisperError(err?.code);
        if (d.action === "stop" || !switchToWebSpeech(d.message)) {
          fail(d.message);
          return;
        }
        setStatus("listening");
        return;
      }
    }
    if (webSpeechSupported()) {
      setEngineBoth("webspeech");
      if (startWebSpeech()) setStatus("listening");
      else fail("Your browser couldn't start speech recognition. Try again.");
      return;
    }
    fail(NONE_AVAILABLE);
  }, [fail, serverHasWhisper, startWebSpeech, switchToWebSpeech]);

  const stop = useCallback(() => {
    wantRef.current = false;
    whisperRef.current.stop();
    stopWebSpeech();
    setInterim("");
    setStatus("idle");
  }, [stopWebSpeech]);

  // Half-duplex: the browser engine stops while TTS talks and comes back after.
  useEffect(() => {
    if (!wantRef.current) return;
    if (engineRef.current === "webspeech") {
      if (suspended) stopWebSpeech();
      else if (!recRef.current) startWebSpeech();
    }
    setStatus(suspended ? "paused" : "listening");
  }, [suspended, startWebSpeech, stopWebSpeech]);

  // A new language applies to the next recognition session.
  useEffect(() => {
    if (wantRef.current && engineRef.current === "webspeech") startWebSpeech();
  }, [language, startWebSpeech]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      wantRef.current = false;
      stopWebSpeech();
    };
  }, [stopWebSpeech]);

  return {
    status,
    listening: status === "listening" || status === "paused" || status === "starting",
    engine,
    interim,
    transcribing: transcribing > 0,
    error,
    notice,
    dismissNotice: useCallback(() => setNotice(null), []),
    dismissError: useCallback(() => setError(null), []),
    start,
    stop,
    supported: webSpeechSupported() || whisperSupported(),
  };
}
