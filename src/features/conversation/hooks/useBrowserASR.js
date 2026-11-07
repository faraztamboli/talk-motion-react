import { useEffect, useRef, useState } from "react";

function getRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export const browserASRSupported = () => Boolean(getRecognition());

/**
 * Speech recognition in the browser (Web Speech API). Zero cost; the device sends text to the
 * conversation with `caption.external`. Keeps listening until disabled.
 *
 * @returns {{ supported: boolean, listening: boolean, error: string|null }}
 */
export default function useBrowserASR({ enabled, lang = "en-US", onPartial, onFinal }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const callbacks = useRef({});
  callbacks.current = { onPartial, onFinal };
  const supported = browserASRSupported();

  useEffect(() => {
    const Recognition = getRecognition();
    if (!enabled || !Recognition) return undefined;

    let stopped = false;
    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || "";
        if (!transcript) continue;
        if (result.isFinal) callbacks.current.onFinal?.(transcript, result[0].confidence);
        else interim += `${transcript} `;
      }
      if (interim.trim()) callbacks.current.onPartial?.(interim.trim());
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stopped = true;
        setError("mic_denied");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error);
      }
    };
    rec.onend = () => {
      // Browsers stop recognition after silence; restart while the user wants to listen.
      if (stopped) {
        setListening(false);
        return;
      }
      try {
        rec.start();
      } catch {
        setListening(false);
      }
    };

    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("start_failed");
    }

    return () => {
      stopped = true;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      setListening(false);
    };
  }, [enabled, lang]);

  return { supported, listening, error };
}
