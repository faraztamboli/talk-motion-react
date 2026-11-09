import { useEffect, useRef, useState } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
import {
  framesToFeatures,
  featureCount,
  FEATURE_SPEC_VERSION,
} from "../utils/featurePipeline";

// TF.js is ~1MB gzipped; load it only when a browser-runnable model exists.
let tfPromise = null;
function loadTf() {
  if (!tfPromise) {
    tfPromise = import("@tensorflow/tfjs");
  }
  return tfPromise;
}

/**
 * In-browser sign recognition. Asks the server whether the selected model has
 * TF.js artifacts (exported at training time); if so, loads them plus the
 * label metadata and exposes predict(frames) that runs entirely on-device —
 * zero recognition round-trips. When no artifacts exist (old model, export
 * skipped) `ready` stays false and callers keep using the server endpoint.
 */
function useLocalModel({ modelId }) {
  const [token] = useLocalStorage("token");
  const [ready, setReady] = useState(false);
  const modelRef = useRef(null);
  const metaRef = useRef(null);
  const tfRef = useRef(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    setReady(false);
    modelRef.current = null;
    metaRef.current = null;
    if (!modelId || !token) return;
    const seq = ++loadSeqRef.current;

    try {
      JS2Py.PythonFunctions.TalkMotionServer.getModelInferenceInfo(
        token,
        modelId,
        async function (info) {
          if (seq !== loadSeqRef.current) return; // model changed mid-flight
          const meta = info && info.meta_data;
          if (
            !info ||
            !info.tfjs_url ||
            !meta ||
            (meta.feature_spec_version || 1) < FEATURE_SPEC_VERSION ||
            meta.feature_count !== featureCount()
          ) {
            // no browser artifacts, or trained on a different feature spec:
            // stay on server-side inference
            return;
          }
          try {
            const tf = await loadTf();
            // LSTM models export as Layers models; transformer models (which
            // TF.js Layers cannot rebuild) export as graph models
            const model =
              meta.tfjs_format === "graph"
                ? await tf.loadGraphModel(info.tfjs_url)
                : await tf.loadLayersModel(info.tfjs_url);
            if (seq !== loadSeqRef.current) return;
            tfRef.current = tf;
            modelRef.current = model;
            metaRef.current = meta;
            setReady(true);
            console.log(`Local inference active for model ${modelId}`);
          } catch (err) {
            console.warn(
              "TF.js model load failed; using server inference:",
              err
            );
          }
        }
      );
    } catch (err) {
      console.warn("getModelInferenceInfo failed; using server inference:", err);
    }
  }, [modelId, token]);

  /**
   * frames: [{t, data}] -> Promise<[{word, confidence}...]> (top 3),
   * same shape as the server's translateGestureSample response.
   */
  async function predict(frames) {
    const tf = tfRef.current;
    const model = modelRef.current;
    const meta = metaRef.current;
    if (!tf || !model || !meta) throw new Error("Local model not ready");
    const seqLen = meta.input_sequence_length;
    const width = featureCount();
    const features = framesToFeatures(frames, seqLen);
    const input = tf.tensor3d(features, [1, seqLen, width]);
    try {
      const output = model.predict(input);
      const probs = await output.data();
      output.dispose();
      const labels = meta.label_dictionary;
      const indices = Array.from(probs.keys()).sort((a, b) => probs[b] - probs[a]);
      return indices.slice(0, 3).map((i) => ({
        word: labels[i],
        confidence: probs[i],
      }));
    } finally {
      input.dispose();
    }
  }

  return { ready, predict };
}

export default useLocalModel;
