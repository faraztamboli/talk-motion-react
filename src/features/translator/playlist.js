/**
 * Sign-video playlists.
 *
 * translateWordsToGestures returns [dictionary, playlist]: dictionary maps a key to
 * { remote_url, concept, ... }, playlist is the play order. The playlist also carries word
 * separators (" ") and fingerspelling keys that may exist in the dictionary only without their
 * underscores ("_h" -> "h"), or not at all. buildPlaylist turns that into playable items and the
 * words that had no video, so the page can say what it couldn't sign.
 */

export function resolveKey(dictionary, key) {
  if (!dictionary || typeof key !== "string") return null;
  if (dictionary[key]?.remote_url) return key;
  const bare = key.replace(/_/g, "");
  if (bare && dictionary[bare]?.remote_url) return bare;
  return null;
}

export function buildPlaylist(dictionary, playlist, batchId = 0) {
  const items = [];
  const missing = [];
  let spelling = []; // letters of the word being fingerspelled, for missing-word reporting
  let spellingMissing = false;
  const endWord = () => {
    if (spelling.length && spellingMissing) missing.push(spelling.join(""));
    spelling = [];
    spellingMissing = false;
  };
  (Array.isArray(playlist) ? playlist : []).forEach((entry, i) => {
    if (typeof entry !== "string") return;
    if (!entry.trim()) {
      endWord();
      return;
    }
    const isLetter = entry.replace(/_/g, "").length === 1;
    const key = resolveKey(dictionary, entry);
    if (isLetter) spelling.push(entry.replace(/_/g, ""));
    if (!key) {
      if (isLetter) spellingMissing = true;
      else missing.push(entry);
      return;
    }
    items.push({
      id: `${batchId}-${i}`,
      key,
      label: isLetter ? key.replace(/_/g, "").toUpperCase() : key.replace(/_/g, " ").trim(),
      url: dictionary[key].remote_url,
      fingerspelled: isLetter,
      batch: batchId,
    });
  });
  endWord();
  return { items, missing };
}

export const initialQueue = { items: [], index: -1, lastBatch: [], nextBatch: 1 };

/**
 * Video queue. `index` points at the item playing; -1 when idle. Items stay in the list after
 * playing so Replay can run the last sentence again.
 */
export function queueReducer(state, action) {
  switch (action.type) {
    case "enqueue": {
      if (!action.items?.length) return state;
      const items = [...state.items, ...action.items];
      const index = state.index === -1 ? state.items.length : state.index;
      return { ...state, items, index, lastBatch: action.items, nextBatch: state.nextBatch + 1 };
    }
    case "ended":
    case "skip": {
      if (state.index === -1) return state;
      const next = state.index + 1;
      return next < state.items.length ? { ...state, index: next } : { ...state, index: -1 };
    }
    case "stop":
      return { ...state, items: [], index: -1 };
    case "replay": {
      if (!state.lastBatch.length) return state;
      // Fresh ids so the player reloads even if the same clip is on screen.
      const items = state.lastBatch.map((item) => ({ ...item, id: `${item.id}~r${state.nextBatch}` }));
      return { ...state, items, index: 0, nextBatch: state.nextBatch + 1 };
    }
    default:
      return state;
  }
}

export const currentItem = (state) => (state.index >= 0 ? state.items[state.index] : null);
