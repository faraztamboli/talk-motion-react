import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { hasRpc, rpc, rpcErrorMessage, sessionToken } from "../../api/rpc";
import { createSegmenter } from "./segmenter";
import { glossOf, initialSentence, sentenceReducer } from "./sentence";
import useBrowserModel from "./useBrowserModel";

const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** The classic RemotePy gloss smoother: the Translator's way to English. */
export async function remotePyToEnglish(gloss) {
  if (!hasRpc("smoothGlossToEnglish")) return null;
  const res = await rpc("smoothGlossToEnglish", [sessionToken(), gloss], { raw: true, timeoutMs: 20000 });
  return typeof res?.text === "string" ? res.text : null;
}

/** toEnglish's answer -> { text, draftId, modelVersion }, or null when it gave nothing usable. */
function englishOf(res) {
  if (typeof res === "string") return res.trim() ? { text: res.trim(), draftId: null, modelVersion: null } : null;
  if (res && typeof res.text === "string" && res.text.trim()) {
    return { text: res.text.trim(), draftId: res.draftId || null, modelVersion: res.modelVersion || null };
  }
  return null;
}

/**
 * Sign -> sentence. Feed it landmark frames (useLandmarker's onFrame); it cuts signs, predicts
 * each one (in the browser when the model allows, otherwise on the server), builds the sentence,
 * and on Send (or automatically after a pause) turns the gloss into English and calls
 * onSentence(text, gloss, meta).
 *
 *   const rec = useSignRecognizer({ modelId, autoSend, idleMs, onSentence });
 *   useLandmarker({ onFrame: rec.onFrame, fullFace: rec.fullFace });
 *
 * toEnglish(gloss) -> string | { text, draftId?, modelVersion? } | null. Defaults to the classic
 * server's smoother; Conversation Mode passes its own (the conversation's language layer). When it
 * fails or gives nothing, the raw gloss is the sentence.
 *
 * meta: { modelVersion, confidence (mean of the kept words), recognizeMs (mean time from a sign
 * ending to its word appearing), englishMs, draftId, englishModelVersion } for measuring drafts.
 */
export default function useSignRecognizer({ modelId, autoSend = true, idleMs = 1500, onSentence, toEnglish = remotePyToEnglish }) {
  const browser = useBrowserModel(modelId);
  const [state, dispatch] = useReducer(sentenceReducer, initialSentence);
  const [signing, setSigning] = useState(false);
  const [sending, setSending] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const browserRef = useRef(browser);
  browserRef.current = browser;
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;
  const autoSendRef = useRef(autoSend);
  autoSendRef.current = autoSend;
  const onSentenceRef = useRef(onSentence);
  onSentenceRef.current = onSentence;
  const toEnglishRef = useRef(toEnglish);
  toEnglishRef.current = toEnglish;
  // Recognition latency (ms) of each word in the current sentence.
  const latenciesRef = useRef([]);

  // The reducer's generation, mirrored synchronously: bumped by every clear/send/reset.
  const generationRef = useRef(0);
  const requestIdRef = useRef(0);
  const sendWhenSettledRef = useRef(false);
  const segmenterRef = useRef(createSegmenter({ idleMs }));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    segmenterRef.current = createSegmenter({ idleMs });
  }, [idleMs]);

  const newGeneration = useCallback((type = "clear") => {
    generationRef.current += 1;
    sendWhenSettledRef.current = false;
    latenciesRef.current = [];
    dispatch({ type });
  }, []);

  // A different model is a different vocabulary: start the sentence over.
  useEffect(() => {
    segmenterRef.current.reset();
    newGeneration("clear");
    setSigning(false);
  }, [modelId, newGeneration]);

  const predict = useCallback(async (frames) => {
    const generation = generationRef.current;
    const requestId = ++requestIdRef.current;
    const startedAt = now();
    dispatch({ type: "requested", generation, requestId });
    try {
      let predictions = null;
      if (browserRef.current.ready) {
        try {
          predictions = await browserRef.current.predict(frames);
        } catch (err) {
          console.warn("Browser recognition failed for a sign; asking the server", err);
        }
      }
      if (!predictions) {
        // A v1 model reads only the first sequenceLength frames (the server truncates the rest),
        // and its frames carry the whole face mesh, so don't send what it would drop.
        const seqLen = browserRef.current.legacyInput?.sequenceLength;
        const sent = seqLen ? frames.slice(0, Math.max(seqLen, 2)) : frames;
        const res = await rpc("translateGestureSample", [sessionToken(), modelIdRef.current, sent]);
        predictions = res?.predictions || [];
      }
      if (mountedRef.current) {
        if (generation === generationRef.current) latenciesRef.current.push(now() - startedAt);
        dispatch({ type: "predicted", generation, requestId, predictions, at: Date.now() });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "failed", generation, requestId, message: rpcErrorMessage(err, "That sign couldn't be recognized.") });
      }
    }
  }, []);

  const doSend = useCallback(async () => {
    const gloss = glossOf(stateRef.current);
    sendWhenSettledRef.current = false;
    if (!gloss.length) return;
    const confidence = mean(stateRef.current.words.map((w) => w.confidence));
    const recognizeMs = mean(latenciesRef.current);
    newGeneration("sent");
    setSending(true);
    const startedAt = now();
    let english = null;
    try {
      english = englishOf(await toEnglishRef.current?.(gloss));
    } catch {
      // the raw gloss is still a faithful sentence
    } finally {
      if (mountedRef.current) setSending(false);
    }
    const meta = {
      modelVersion: modelIdRef.current ? `legacy:${modelIdRef.current}` : null,
      confidence,
      recognizeMs: recognizeMs === null ? null : Math.round(recognizeMs),
      englishMs: Math.round(now() - startedAt),
      draftId: english?.draftId || null,
      englishModelVersion: english?.modelVersion || null,
    };
    if (mountedRef.current) onSentenceRef.current?.(english?.text || gloss.join(" "), gloss, meta);
  }, [newGeneration]);

  /** Send the sentence now. A sign still being made is cut and included. */
  const send = useCallback(() => {
    const flushed = segmenterRef.current.flush().filter((e) => e.type === "segment");
    flushed.forEach((e) => predict(e.frames));
    if (flushed.length || stateRef.current.pending.length) sendWhenSettledRef.current = true;
    else doSend();
  }, [doSend, predict]);

  // Send once the predictions still in flight have landed.
  useEffect(() => {
    if (sendWhenSettledRef.current && state.pending.length === 0) doSend();
  }, [state.pending.length, doSend]);

  const onFrame = useCallback(
    (frame, meta) => {
      const events = segmenterRef.current.push(frame, meta?.timestamp ?? Date.now());
      for (const event of events) {
        if (event.type === "segment") predict(event.frames);
        else if (event.type === "signing") setSigning(true);
        else if (event.type === "resting" || event.type === "handsGone") setSigning(false);
        else if (event.type === "idle" && autoSendRef.current) {
          const s = stateRef.current;
          if (s.pending.length) sendWhenSettledRef.current = true;
          else if (s.words.length) doSend();
        }
      }
    },
    [doSend, predict]
  );

  const clear = useCallback(() => newGeneration("clear"), [newGeneration]);

  /** Camera stopped: forget the partial sign and the sentence. */
  const reset = useCallback(() => {
    segmenterRef.current.reset();
    setSigning(false);
    newGeneration("clear");
  }, [newGeneration]);

  return {
    onFrame,
    words: state.words,
    pendingCount: state.pending.length,
    lastMiss: state.lastMiss,
    error: state.error,
    signing,
    sending,
    send,
    clear,
    reset,
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    remove: useCallback((id) => dispatch({ type: "remove", id }), []),
    choose: useCallback((id, word) => dispatch({ type: "choose", id, word }), []),
    confirm: useCallback((id) => dispatch({ type: "confirm", id }), []),
    dismissError: useCallback(() => dispatch({ type: "dismissError" }), []),
    recognitionMode: browser.status, // off | checking | loading | ready | server
    /** The model was trained on full face meshes: pass to useLandmarker({ fullFace }). */
    fullFace: Boolean(browser.legacyInput),
  };
}
