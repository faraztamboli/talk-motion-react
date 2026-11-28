import { hasRpc, rpc, sessionToken } from "../../api/rpc";

const MAX_WORDS_PER_CALL = 30;

/**
 * Fetch avatar poses for a gloss and hand them over as they arrive: the first word on its own
 * (so the avatar starts signing after one short round trip), then the rest in one call.
 * onItems(items, missingWords) may be called several times. Uses getConceptPoses; servers
 * without it fall back to one getConceptPose call per word (recorded samples, so mirrored).
 * `isCancelled()` stops delivery when the user pressed Stop meanwhile.
 */
export async function fetchPoses(modelId, words, onItems, isCancelled = () => false) {
  const clean = (words || []).filter((w) => typeof w === "string" && w.trim());
  if (!clean.length) return;
  if (hasRpc("getConceptPoses")) {
    const batches = [clean.slice(0, 1)];
    for (let i = 1; i < clean.length; i += MAX_WORDS_PER_CALL) batches.push(clean.slice(i, i + MAX_WORDS_PER_CALL));
    // All requests go out at once and are handed over in order: asking for the rest only after
    // the first word arrived left a pause (and a relaxed avatar) whenever that word was short.
    const pending = batches.map((batch) => rpc("getConceptPoses", [sessionToken(), modelId, batch]));
    pending.forEach((p) => p.catch(() => {})); // a later failure is reported when its turn comes
    for (const request of pending) {
      const res = await request;
      if (isCancelled()) return;
      onItems(Array.isArray(res?.items) ? res.items : [], Array.isArray(res?.missing) ? res.missing : []);
    }
    return;
  }
  for (const word of clean) {
    let res = null;
    try {
      res = await rpc("getConceptPose", [sessionToken(), modelId, word], { raw: true });
    } catch {
      res = null;
    }
    if (isCancelled()) return;
    if (Array.isArray(res?.frames) && res.frames.length > 1) {
      onItems([{ word, label: word, frames: res.frames, fps: res.fps || 15, mirrored: true }], []);
    } else onItems([], [word]);
  }
}
