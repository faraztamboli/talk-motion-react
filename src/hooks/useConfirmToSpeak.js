import { useCallback, useState } from "react";

export const AUTO_SPEAK_KEY = "tm_translator_autospeak";

function readAutoSpeak() {
  try {
    return localStorage.getItem(AUTO_SPEAK_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The legacy Translator's version of TalkMotion's core promise: nothing is spoken on your
 * behalf until you tap Speak. A recognized sign becomes a draft. Signers who want hands-free
 * speech can turn on "Speak automatically"; it is off until they do, and it is remembered on
 * this device.
 *
 * @param {(text: string, volume: number) => void} speak
 */
export default function useConfirmToSpeak(speak) {
  const [autoSpeak, setAutoSpeakState] = useState(readAutoSpeak);
  const [draft, setDraft] = useState(null);

  const offer = useCallback(
    (text, volume) => {
      if (!text) return;
      if (autoSpeak) speak(text, volume);
      else setDraft(text);
    },
    [autoSpeak, speak]
  );

  const confirm = useCallback(
    (volume) => {
      if (!draft) return;
      speak(draft, volume);
      setDraft(null);
    },
    [draft, speak]
  );

  const dismiss = useCallback(() => setDraft(null), []);

  const setAutoSpeak = useCallback((on) => {
    setAutoSpeakState(Boolean(on));
    try {
      localStorage.setItem(AUTO_SPEAK_KEY, on ? "1" : "0");
    } catch {
      // storage unavailable: the choice lasts until the page reloads
    }
  }, []);

  return { draft, offer, confirm, dismiss, autoSpeak, setAutoSpeak };
}
