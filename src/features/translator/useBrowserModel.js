import { useCallback, useEffect, useRef, useState } from "react";
import { hasRpc, rpc, sessionToken } from "../../api/rpc";
import { FEATURE_SPEC_VERSION, featureCount, framesToFeatures } from "../../utils/featurePipeline";

// TF.js is large; it is only downloaded when the chosen model can run in the browser.
let tfPromise = null;
const loadTf = () => {
  if (!tfPromise) {
    tfPromise = import("@tensorflow/tfjs").catch((err) => {
      tfPromise = null;
      throw err;
    });
  }
  return tfPromise;
};

/** Whether server metadata describes a model this browser build can run. */
export function canRunInBrowser(info) {
  const meta = info?.meta_data;
  return Boolean(
    info?.tfjs_url &&
      meta &&
      (meta.feature_spec_version || 1) >= FEATURE_SPEC_VERSION &&
      meta.feature_count === featureCount() &&
      meta.label_dictionary &&
      typeof meta.label_dictionary === "object"
  );
}

/** probabilities -> top 3 [{word, confidence}] */
export function topPredictions(probs, labels, n = 3) {
  const indices = Array.from(probs.keys()).sort((a, b) => probs[b] - probs[a]);
  return indices
    .slice(0, n)
    .map((i) => ({ word: labels?.[i] ?? labels?.[String(i)], confidence: Number(probs[i]) }))
    .filter((p) => typeof p.word === "string");
}

/**
 * In-browser recognition for models the server exported to TF.js at training time.
 *
 * status: "off" (no model) | "checking" | "loading" | "ready" | "server" (no browser version:
 * recognition runs on the server). A model is disposed when another one is chosen or the page
 * goes away, so switching models doesn't leak GPU memory.
 */
export default function useBrowserModel(modelId) {
  const [status, setStatus] = useState("off");
  const loadedRef = useRef(null); // { tf, model, meta, modelId }

  const disposeLoaded = useCallback(() => {
    const loaded = loadedRef.current;
    loadedRef.current = null;
    try {
      loaded?.model?.dispose?.();
    } catch {
      // already gone
    }
  }, []);

  useEffect(() => {
    disposeLoaded();
    if (!modelId) {
      setStatus("off");
      return undefined;
    }
    let cancelled = false;
    setStatus("checking");
    (async () => {
      if (!hasRpc("getModelInferenceInfo")) {
        if (!cancelled) setStatus("server");
        return;
      }
      let info;
      try {
        info = await rpc("getModelInferenceInfo", [sessionToken(), modelId]);
      } catch {
        if (!cancelled) setStatus("server");
        return;
      }
      if (cancelled) return;
      if (!canRunInBrowser(info)) {
        setStatus("server");
        return;
      }
      setStatus("loading");
      try {
        const tf = await loadTf();
        const meta = info.meta_data;
        const model = meta.tfjs_format === "graph" ? await tf.loadGraphModel(info.tfjs_url) : await tf.loadLayersModel(info.tfjs_url);
        if (cancelled) {
          model.dispose?.();
          return;
        }
        loadedRef.current = { tf, model, meta, modelId: String(modelId) };
        setStatus("ready");
      } catch (err) {
        console.warn("Browser model failed to load; recognizing on the server", err);
        if (!cancelled) setStatus("server");
      }
    })();
    return () => {
      cancelled = true;
      disposeLoaded();
    };
  }, [modelId, disposeLoaded]);

  /** frames [{t, data}] -> top-3 predictions, like translateGestureSample. */
  const predict = useCallback(async (frames) => {
    const loaded = loadedRef.current;
    if (!loaded) throw new Error("Browser model not ready");
    const { tf, model, meta } = loaded;
    const seqLen = meta.input_sequence_length;
    const width = featureCount();
    const input = tf.tensor3d(framesToFeatures(frames, seqLen), [1, seqLen, width]);
    let output;
    try {
      output = model.predict(input);
      const probs = await output.data();
      return topPredictions(probs, meta.label_dictionary);
    } finally {
      input.dispose();
      output?.dispose?.();
    }
  }, []);

  return { status, predict, ready: status === "ready" };
}
