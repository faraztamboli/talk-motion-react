import { useEffect, useRef, useState } from "react";
import { createPcmPipeline, rmsLevel } from "../audio/pcm";

// Served from public/worklets/ as a separate same-origin file.
const WORKLET_URL = `${import.meta.env.BASE_URL}worklets/pcm-capture.js`;

export function micStreamSupported() {
  return Boolean(
    typeof navigator !== "undefined" &&
      navigator.mediaDevices?.getUserMedia &&
      (window.AudioContext || window.webkitAudioContext)
  );
}

/**
 * Captures the microphone while `enabled` and calls onFrame(ArrayBuffer) with 20 ms PCM16
 * frames at 16 kHz, the format the conversation socket expects for server-side recognition.
 * Uses an AudioWorklet, falling back to ScriptProcessor on older browsers.
 *
 * @returns {{ supported: boolean, active: boolean, level: number, error: string|null }}
 *   error: "mic_denied" | "mic_failed"
 */
export default function useMicStream({ enabled, onFrame }) {
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const supported = micStreamSupported();

  useEffect(() => {
    if (!enabled || !supported) return undefined;
    let cancelled = false;
    let stream = null;
    let context = null;
    let node = null;
    let source = null;
    let lastLevelAt = 0;

    const handleChunk = (pipeline, chunk) => {
      for (const frame of pipeline(chunk)) onFrameRef.current?.(frame);
      const now = performance.now();
      if (now - lastLevelAt > 100) {
        lastLevelAt = now;
        setLevel(Math.min(1, rmsLevel(chunk) * 4));
      }
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        context = new Ctx();
        const pipeline = createPcmPipeline(context.sampleRate);
        source = context.createMediaStreamSource(stream);
        if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
          await context.audioWorklet.addModule(WORKLET_URL);
          if (cancelled) return;
          node = new AudioWorkletNode(context, "pcm-capture");
          node.port.onmessage = (event) => handleChunk(pipeline, event.data);
        } else {
          node = context.createScriptProcessor(4096, 1, 1);
          node.onaudioprocess = (event) => handleChunk(pipeline, event.inputBuffer.getChannelData(0));
        }
        source.connect(node);
        // ScriptProcessor only runs when connected to the output; it writes silence.
        if (!node.port) node.connect(context.destination);
        if (context.state === "suspended") await context.resume();
        setError(null);
        setActive(true);
      } catch (err) {
        if (cancelled) return;
        setError(err && (err.name === "NotAllowedError" || err.name === "SecurityError") ? "mic_denied" : "mic_failed");
        setActive(false);
      }
    })();

    return () => {
      cancelled = true;
      setActive(false);
      setLevel(0);
      try {
        if (node?.port) node.port.onmessage = null;
        node?.disconnect();
        source?.disconnect();
      } catch {
        // already disconnected
      }
      stream?.getTracks().forEach((track) => track.stop());
      context?.close?.().catch(() => {});
    };
  }, [enabled, supported]);

  return { supported, active, level, error };
}
