import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/http";

export const VOICE_KEY = "tm_voice_id";

function readVoice() {
  try {
    return localStorage.getItem(VOICE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * The voices a person can pick for their spoken replies (GET /api/v1/voices), and the one
 * they picked, remembered on this device. Falls back to the server's default voice when the
 * remembered one is no longer offered.
 */
export default function useVoices(provider) {
  const [list, setList] = useState({ voices: [], defaultVoiceId: null });
  const [chosen, setChosen] = useState(readVoice);

  useEffect(() => {
    if (!provider) return undefined;
    let alive = true;
    apiFetch(`/voices?provider=${encodeURIComponent(provider)}`, { auth: false })
      .then((res) => {
        if (alive) setList({ voices: res.voices || [], defaultVoiceId: res.default_voice_id || null });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [provider]);

  const offered = list.voices.some((v) => v.id === chosen);
  const voiceId = offered ? chosen : list.defaultVoiceId;

  const setVoiceId = useCallback((id) => {
    setChosen(id);
    try {
      localStorage.setItem(VOICE_KEY, id);
    } catch {
      // private mode: remember for this visit only
    }
  }, []);

  return { voices: list.voices, voiceId, setVoiceId };
}
