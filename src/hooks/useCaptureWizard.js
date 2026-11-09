import { useState, useRef, useEffect, useCallback } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

/**
 * Guided sample-capture state machine for the Collector page:
 *
 *   idle -> countdown (3-2-1) -> recording (buffer frames locally until
 *   sequenceLength frames with a hand) -> review (skeleton replay,
 *   Keep / Retake) -> submitting -> idle
 *
 * Frames never leave the browser until the user presses Keep, which sends the
 * whole reviewed sample in one submitGestureSample call. Bad takes are
 * discarded with Retake instead of polluting the training set.
 */
function useCaptureWizard({ modelId, concept, sequenceLength = 30 }) {
  const [token] = useLocalStorage("token");
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [frameCount, setFrameCount] = useState(0);
  const [sampleCount, setSampleCount] = useState(null);
  const [error, setError] = useState(null);

  const phaseRef = useRef("idle");
  const framesRef = useRef([]);
  const countdownTimerRef = useRef(null);

  const targetFrames = Math.max(2, sequenceLength);

  useEffect(() => {
    return () => clearInterval(countdownTimerRef.current);
  }, []);

  // Show how many samples already exist as soon as a concept is chosen
  // (from the durable DB index), debounced while the user is typing.
  useEffect(() => {
    setSampleCount(null);
    if (!modelId || !concept || !concept.trim()) return undefined;
    const timer = setTimeout(() => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getConceptSampleCount(
          token,
          modelId,
          concept,
          function (res) {
            if (res && typeof res.sample_count === "number") {
              setSampleCount(res.sample_count);
            }
          }
        );
      } catch (err) {
        // endpoint unavailable (older server): count appears after first save
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [modelId, concept, token]);

  const goTo = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // Called by useHolisticModel for every processed camera frame.
  const onFrame = useCallback(
    (data) => {
      if (phaseRef.current !== "recording") return;
      const hasHand = data.leftHandLandmarks || data.rightHandLandmarks;
      if (!hasHand) return;
      framesRef.current.push({ t: Date.now(), data });
      const count = framesRef.current.length;
      setFrameCount(count);
      if (count >= targetFrames) {
        goTo("review");
      }
    },
    [targetFrames, goTo]
  );

  const startCapture = useCallback(() => {
    setError(null);
    framesRef.current = [];
    setFrameCount(0);
    setCountdown(3);
    goTo("countdown");
    clearInterval(countdownTimerRef.current);
    let remaining = 3;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        goTo("recording");
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [goTo]);

  const retake = startCapture;

  const cancel = useCallback(() => {
    clearInterval(countdownTimerRef.current);
    framesRef.current = [];
    setFrameCount(0);
    goTo("idle");
  }, [goTo]);

  const keep = useCallback(() => {
    if (phaseRef.current !== "review" || framesRef.current.length < 2) return;
    goTo("submitting");
    try {
      JS2Py.PythonFunctions.TalkMotionServer.submitGestureSample(
        token,
        modelId,
        concept,
        framesRef.current,
        function (res) {
          if (res && typeof res.sample_count === "number") {
            setSampleCount(res.sample_count);
            goTo("idle");
          } else {
            setError("Failed to save sample. Please try again.");
            goTo("review");
          }
        }
      );
    } catch (err) {
      console.error(err);
      setError("Failed to save sample. Please try again.");
      goTo("review");
    }
  }, [token, modelId, concept, goTo]);

  return {
    phase,
    countdown,
    frameCount,
    targetFrames,
    sampleCount,
    error,
    recordedFrames: framesRef.current,
    onFrame,
    startCapture,
    retake,
    keep,
    cancel,
  };
}

export default useCaptureWizard;
