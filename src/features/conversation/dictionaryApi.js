import { apiFetch } from "../../api/http";

/** Normalise like the API does: lowercase, strip surrounding punctuation. */
export function normaliseWord(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, "");
}

const cache = new Map();

/**
 * Sign videos for one word from GET /dictionary/lookup, cached per word for the session.
 * Resolves { videos: [{ url, concept }], fingerspell }. Failures are not cached.
 */
export function lookupSign(raw) {
  const word = normaliseWord(raw);
  if (!word) return Promise.resolve({ videos: [], fingerspell: true });
  if (!cache.has(word)) {
    const p = apiFetch(`/dictionary/lookup?words=${encodeURIComponent(word)}`).then(
      (res) => res?.[word] || { videos: [], fingerspell: true }
    );
    p.catch(() => cache.delete(word));
    cache.set(word, p);
  }
  return cache.get(word);
}

export function clearSignCache() {
  cache.clear();
}
