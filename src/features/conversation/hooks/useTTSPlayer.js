import { useCallback, useEffect, useRef } from "react";
import { speechIdHex } from "../protocol";

/**
 * Plays speech the server sends to this device, one utterance at a time:
 *   speak.start {speech_id, mime_type}  -> binary chunks prefixed with speech_id -> speak.done
 *   speak.fallback {text}               -> the browser's own speechSynthesis
 * onStart/onEnd drive the visual "speaking for you" indicator.
 */
export default function useTTSPlayer({ lang = "en-US", onStart, onEnd } = {}) {
  const buffers = useRef(new Map());
  const queue = useRef([]);
  const playing = useRef(false);
  const audioRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onStart, onEnd };

  const playNext = useCallback(() => {
    const item = queue.current.shift();
    if (!item) {
      playing.current = false;
      return;
    }
    playing.current = true;
    callbacks.current.onStart?.({ utteranceId: item.utteranceId, text: item.text });

    const done = () => {
      callbacks.current.onEnd?.({ utteranceId: item.utteranceId });
      playNext();
    };

    const synthesize = () => {
      const synth = globalThis.speechSynthesis;
      if (!synth || !item.text) {
        done();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = lang;
      utterance.onend = done;
      utterance.onerror = done;
      synth.speak(utterance);
    };

    if (item.blob) {
      const url = URL.createObjectURL(item.blob);
      const audio = audioRef.current || new Audio();
      audioRef.current = audio;
      const finish = () => {
        URL.revokeObjectURL(url);
        done();
      };
      audio.onended = finish;
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        synthesize();
      };
      audio.src = url;
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        synthesize();
      });
    } else {
      synthesize();
    }
  }, [lang]);

  const enqueue = useCallback(
    (item) => {
      queue.current.push(item);
      if (!playing.current) playNext();
    },
    [playNext]
  );

  const begin = useCallback(({ speech_id: speechId, mime_type: mime, utterance_id: utteranceId }) => {
    buffers.current.set(speechIdHex(speechId), { mime: mime || "audio/mpeg", chunks: [], utteranceId });
  }, []);

  const chunk = useCallback((data) => {
    const bytes = new Uint8Array(data);
    if (bytes.length <= 16) return;
    const entry = buffers.current.get(speechIdHex(bytes));
    if (entry) entry.chunks.push(bytes.slice(16));
  }, []);

  const end = useCallback(
    ({ speech_id: speechId, text, utterance_id: utteranceId }) => {
      const id = speechIdHex(speechId);
      const entry = buffers.current.get(id);
      buffers.current.delete(id);
      if (entry?.chunks.length) {
        enqueue({ blob: new Blob(entry.chunks, { type: entry.mime }), text, utteranceId });
      } else {
        enqueue({ text, utteranceId });
      }
    },
    [enqueue]
  );

  const speakText = useCallback(({ text, utterance_id: utteranceId }) => enqueue({ text, utteranceId }), [enqueue]);

  /** Call from a tap: mobile browsers only allow audio after a user gesture. */
  const unlock = useCallback(() => {
    if (!audioRef.current && typeof Audio !== "undefined") audioRef.current = new Audio();
    const synth = globalThis.speechSynthesis;
    if (synth && !synth.speaking && typeof SpeechSynthesisUtterance !== "undefined") {
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0;
      synth.speak(silent);
    }
  }, []);

  useEffect(
    () => () => {
      queue.current = [];
      globalThis.speechSynthesis?.cancel?.();
      audioRef.current?.pause?.();
    },
    []
  );

  return { begin, chunk, end, speakText, unlock };
}
