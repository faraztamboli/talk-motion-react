import { useCallback, useEffect, useRef, useState } from "react";
import { readPref, writePref } from "./prefs";

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

/** The voice to use: the saved one if it still exists, else the browser default for the language. */
export function pickVoice(voices, savedUri, lang = "en") {
  if (!voices?.length) return null;
  const saved = savedUri && voices.find((v) => v.voiceURI === savedUri);
  if (saved) return saved;
  const base = String(lang).toLowerCase().split("-")[0];
  const sameLang = voices.filter((v) => String(v.lang || "").toLowerCase().startsWith(base));
  return sameLang.find((v) => v.default) || sameLang[0] || voices.find((v) => v.default) || voices[0];
}

/**
 * Text-to-speech for signed sentences (Web Speech synthesis).
 *
 * supported: false in browsers without speechSynthesis (the page then shows text only).
 * Voices often arrive after the page loads (Chrome), so the list follows "voiceschanged".
 * Speech is cancelled on stop() and when the page goes away. `speaking` lets the microphone
 * pause while TTS talks, so the translator doesn't hear itself.
 */
export default function useSpeechOutput({ lang = "en-US" } = {}) {
  const supported = Boolean(synth());
  const [voices, setVoices] = useState(() => synth()?.getVoices?.() || []);
  const [voiceUri, setVoiceUriState] = useState(() => readPref("voice", null));
  const [volume, setVolumeState] = useState(() => readPref("volume", 0.8));
  const [rate, setRateState] = useState(() => readPref("rate", 1));
  const [speaking, setSpeaking] = useState(false);
  const activeRef = useRef(0);

  useEffect(() => {
    const s = synth();
    if (!s) return undefined;
    const update = () => setVoices(s.getVoices() || []);
    update();
    s.addEventListener?.("voiceschanged", update);
    return () => {
      s.removeEventListener?.("voiceschanged", update);
      s.cancel();
    };
  }, []);

  const voice = pickVoice(voices, voiceUri, lang);

  const speak = useCallback(
    (text, volumeOverride) => {
      const s = synth();
      const clean = String(text || "").trim();
      if (!s || !clean) return false;
      const utterance = new SpeechSynthesisUtterance(clean);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || lang;
      utterance.volume = Math.max(0, Math.min(1, Number(volumeOverride ?? volume)));
      utterance.rate = rate;
      const done = () => {
        activeRef.current = Math.max(0, activeRef.current - 1);
        if (activeRef.current === 0) setSpeaking(false);
      };
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = done;
      utterance.onerror = done;
      activeRef.current += 1;
      setSpeaking(true);
      s.speak(utterance);
      return true;
    },
    [lang, rate, voice, volume]
  );

  const stop = useCallback(() => {
    synth()?.cancel();
    activeRef.current = 0;
    setSpeaking(false);
  }, []);

  const setVoiceUri = useCallback((uri) => {
    setVoiceUriState(uri || null);
    writePref("voice", uri || null);
  }, []);
  const setVolume = useCallback((v) => {
    setVolumeState(v);
    writePref("volume", v);
  }, []);
  const setRate = useCallback((r) => {
    setRateState(r);
    writePref("rate", r);
  }, []);

  return { supported, voices, voice, setVoiceUri, volume, setVolume, rate, setRate, speak, stop, speaking };
}
