import { useEffect, useState, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../api/http";

const STORAGE_KEY = "tm_plain_language";
const MIN_WORDS = 4;
export const DEBOUNCE_MS = 600;

const cache = new Map();
const listeners = new Set();

export const countWords = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;
export const clearPlainLanguageCache = () => cache.clear();

function readEnabled() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The "Plain language" toggle, persisted in localStorage and shared by every panel. */
export function usePlainLanguageToggle() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
  const setEnabled = (on) => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // storage unavailable: toggle just won't persist
    }
    listeners.forEach((fn) => fn());
  };
  return [enabled, setEnabled];
}

/**
 * Simplified version of `text` from the API language layer. Only runs with an API session,
 * when enabled, for text of at least 4 words; debounced and cached by text. Errors are
 * reported as `error: true` and never thrown.
 */
export function usePlainLanguage(text, enabled) {
  const authed = useSelector((state) => state.apiAuth.status === "authenticated");
  const clean = (text || "").trim();
  const active = Boolean(authed && enabled && countWords(clean) >= MIN_WORDS);
  const [state, setState] = useState({ text: "", plain: "", loading: false, error: false });

  useEffect(() => {
    if (!active) return undefined;
    if (cache.has(clean)) {
      setState({ text: clean, plain: cache.get(clean), loading: false, error: false });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, text: clean, loading: true, error: false }));
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch("/language/plain", { method: "POST", body: { text: clean.slice(0, 1000) } });
        cache.set(clean, res.plain_text);
        if (!cancelled) setState({ text: clean, plain: res.plain_text, loading: false, error: false });
      } catch {
        if (!cancelled) setState({ text: clean, plain: "", loading: false, error: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, clean]);

  if (!active) return { available: Boolean(authed), plain: "", loading: false, error: false };
  const fresh = state.text === clean;
  return {
    available: true,
    plain: fresh ? state.plain : "",
    loading: fresh ? state.loading : true,
    error: fresh ? state.error : false,
  };
}
