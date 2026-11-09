/**
 * The sentence being signed, as a reducer.
 *
 * Each prediction for a segment becomes a word: "firm" at or above the firm threshold,
 * "tentative" between the two thresholds (shown with a "?" and kept, so the signer decides),
 * and below that it is reported as a miss instead of disappearing silently. Repeats are kept
 * (a real "very very"); the segmenter no longer cuts one held sign into two.
 *
 * Predictions in flight are tracked by request id within a generation: Clear, Send and Reset
 * start a new generation, so a late answer from before can never land in the next sentence and
 * the pending count can't go negative or get stuck.
 */

export const CONFIDENCE_FIRM = 0.65;
export const CONFIDENCE_TENTATIVE = 0.35;

export const initialSentence = {
  generation: 0,
  words: [], // { id, word, confidence, status: "firm" | "tentative", alternatives: [{word, confidence}] }
  pending: [], // request ids in flight for this generation
  lastMiss: null, // { at, best } when a segment was too uncertain to show
  error: null, // last prediction error message, cleared by the next success
  nextId: 1,
};

function cleanPredictions(predictions) {
  if (!Array.isArray(predictions)) return [];
  return predictions
    .filter((p) => p && typeof p.word === "string" && p.word && Number.isFinite(Number(p.confidence)))
    .map((p) => ({ word: p.word, confidence: Number(p.confidence) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export function sentenceReducer(state, action) {
  switch (action.type) {
    case "requested": {
      if (action.generation !== state.generation) return state;
      return { ...state, pending: [...state.pending, action.requestId] };
    }
    case "predicted": {
      if (action.generation !== state.generation) return state;
      const pending = state.pending.filter((id) => id !== action.requestId);
      const ranked = cleanPredictions(action.predictions);
      const top = ranked[0];
      const thresholds = { firm: action.firm ?? CONFIDENCE_FIRM, tentative: action.tentative ?? CONFIDENCE_TENTATIVE };
      if (!top || top.confidence < thresholds.tentative) {
        return { ...state, pending, error: null, lastMiss: { at: action.at ?? Date.now(), best: top || null } };
      }
      const word = {
        id: state.nextId,
        word: top.word,
        confidence: top.confidence,
        status: top.confidence >= thresholds.firm ? "firm" : "tentative",
        alternatives: ranked.slice(1),
      };
      return { ...state, pending, error: null, words: [...state.words, word], nextId: state.nextId + 1 };
    }
    case "failed": {
      if (action.generation !== state.generation) return state;
      return { ...state, pending: state.pending.filter((id) => id !== action.requestId), error: action.message || "Recognition failed" };
    }
    case "undo":
      return state.words.length ? { ...state, words: state.words.slice(0, -1) } : state;
    case "remove":
      return { ...state, words: state.words.filter((w) => w.id !== action.id) };
    case "choose": {
      // Replace a word with one of its alternatives; the chosen word is now certain.
      return {
        ...state,
        words: state.words.map((w) => {
          if (w.id !== action.id) return w;
          const others = [{ word: w.word, confidence: w.confidence }, ...w.alternatives].filter((a) => a.word !== action.word);
          const picked = w.alternatives.find((a) => a.word === action.word);
          return { ...w, word: action.word, confidence: picked?.confidence ?? w.confidence, status: "firm", alternatives: others.slice(0, 2) };
        }),
      };
    }
    case "confirm":
      return { ...state, words: state.words.map((w) => (w.id === action.id ? { ...w, status: "firm" } : w)) };
    case "clear":
    case "sent":
      return { ...initialSentence, generation: state.generation + 1, nextId: state.nextId };
    case "dismissError":
      return { ...state, error: null };
    default:
      return state;
  }
}

/** The gloss to send: every word the signer kept, tentative ones included. */
export const glossOf = (state) => state.words.map((w) => w.word);
