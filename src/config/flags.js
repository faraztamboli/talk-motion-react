/**
 * Feature flags.
 *
 * Resolution order (later wins):
 *   1. build-time defaults from VITE_FLAG_* env vars (fallbacks below)
 *   2. the signed-in user's flags from the TalkMotion API (GET /api/v1/me)
 *   3. local developer overrides in localStorage["tm_flags"]
 *      (only in dev builds, or when VITE_FLAG_OVERRIDES=true)
 *
 * `legacy_models_visible` falls back to TRUE so that, until the API answers for a user,
 * the v1 models/store/trainer stay exactly as they are today. Set
 * VITE_FLAG_LEGACY_MODELS_VISIBLE=false to hide them for everyone without an API session.
 */

export const FLAG_NAMES = [
  "legacy_models_visible",
  "conversation_v2",
  "voice_clone",
  "assemblyai_asr",
  "fingerspelling",
];

export const OVERRIDES_STORAGE_KEY = "tm_flags";

function envBool(value, fallback) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

export function envDefaults(env = import.meta.env) {
  return {
    legacy_models_visible: envBool(env.VITE_FLAG_LEGACY_MODELS_VISIBLE, true),
    conversation_v2: envBool(env.VITE_FLAG_CONVERSATION_V2, false),
    voice_clone: envBool(env.VITE_FLAG_VOICE_CLONE, false),
    assemblyai_asr: envBool(env.VITE_FLAG_ASSEMBLYAI_ASR, false),
    fingerspelling: envBool(env.VITE_FLAG_FINGERSPELLING, false),
  };
}

export function overridesEnabled(env = import.meta.env) {
  return Boolean(env.DEV) || env.VITE_FLAG_OVERRIDES === "true";
}

/** Keep only known flags with boolean values. */
function sanitize(flags) {
  const out = {};
  if (!flags || typeof flags !== "object") return out;
  for (const name of FLAG_NAMES) {
    if (typeof flags[name] === "boolean") out[name] = flags[name];
  }
  return out;
}

export function readLocalOverrides(storage = globalThis.localStorage, env = import.meta.env) {
  if (!overridesEnabled(env)) return {};
  try {
    return sanitize(JSON.parse(storage?.getItem(OVERRIDES_STORAGE_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function saveLocalOverrides(overrides, storage = globalThis.localStorage) {
  const clean = sanitize(overrides);
  try {
    if (Object.keys(clean).length) storage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(clean));
    else storage.removeItem(OVERRIDES_STORAGE_KEY);
  } catch {
    // storage unavailable (private mode); overrides just won't persist
  }
  return clean;
}

export function resolveFlags({ server = null, overrides = {}, env = import.meta.env } = {}) {
  return { ...envDefaults(env), ...sanitize(server), ...sanitize(overrides) };
}
