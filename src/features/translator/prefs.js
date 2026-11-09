/** Translator settings remembered on this device. Every read and write tolerates blocked storage. */

export const PREF_KEYS = {
  model: "tm_translator_model",
  idleMs: "tm_translator_idle_ms",
  autoSend: "tm_translator_autosend",
  voice: "tm_translator_voice",
  volume: "tm_translator_volume",
  rate: "tm_translator_rate",
  language: "tm_translator_language",
  speed: "tm_translator_speed",
  playback: "tm_translator_playback",
};

export function readPref(name, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(PREF_KEYS[name]);
    if (raw === null || raw === undefined) return fallback;
    if (typeof fallback === "number") {
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    }
    if (typeof fallback === "boolean") return raw === "1";
    return raw;
  } catch {
    return fallback;
  }
}

export function writePref(name, value) {
  try {
    if (value === null || value === undefined) globalThis.localStorage?.removeItem(PREF_KEYS[name]);
    else globalThis.localStorage?.setItem(PREF_KEYS[name], typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  } catch {
    // not remembered; the setting still applies to this page
  }
}
