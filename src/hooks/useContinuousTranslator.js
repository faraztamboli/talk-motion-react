import { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
import useLocalModel from "./useLocalModel";
import { setIsSpeaking, setSpeakText } from "../app/features/speechSlice";
import { setIsRecording } from "../app/features/converterSlice";

// Segmentation tuning (frames at ~25-30fps)
const MIN_SEGMENT_FRAMES = 10; // shortest segment worth predicting on
const MAX_SEGMENT_FRAMES = 90; // force a prediction on very long holds
const LOW_VELOCITY_FRAMES = 7; // consecutive near-still frames = sign boundary
const NO_HAND_BOUNDARY_FRAMES = 5; // hands gone -> segment over
const NO_HAND_SENTENCE_FRAMES = 45; // hands gone ~1.5-2s -> sentence over
const VELOCITY_THRESHOLD = 0.012; // normalized-coordinate wrist movement/frame
const CONFIDENCE_FIRM = 0.65; // >= this: word is firm
const CONFIDENCE_TENTATIVE = 0.35; // >= this: show as tentative (gray)

function wristOf(data) {
  const hand = data.rightHandLandmarks || data.leftHandLandmarks;
  return hand && hand[0] ? hand[0] : null;
}

/**
 * Continuous sign recognition: instead of streaming every frame to the server
 * and cutting on a fixed frame count, this hook buffers frames locally and
 * segments signs by motion — a segment ends when the hands go still, leave
 * the frame, or the buffer hits a cap. Each segment goes to the stateless
 * translateGestureSample endpoint, which returns candidates + confidences:
 * high-confidence words are firmed into the sentence, mid-confidence ones
 * show as a revisable tentative caption. When the hands stay away long
 * enough, the accumulated gloss is smoothed to natural English via
 * smoothGlossToEnglish and handed to TTS through the existing speech redux.
 */
function useContinuousTranslator({ modelId }) {
  const [token] = useLocalStorage("token");
  const dispatch = useDispatch();
  // In-browser inference when the model has TF.js artifacts; falls back to
  // the server endpoint otherwise (and on any local failure).
  const localModel = useLocalModel({ modelId });

  const [words, setWords] = useState([]); // firmed gloss words (current sentence)
  const [tentative, setTentative] = useState(null); // {word, confidence} | null
  const [isSigning, setIsSigning] = useState(false);

  const bufferRef = useRef([]); // [{t, data}]
  const lastWristRef = useRef(null);
  const lowVelCountRef = useRef(0);
  const noHandCountRef = useRef(0);
  const wordsRef = useRef([]);
  const pendingRef = useRef(0); // in-flight predictions before sentence close
  const sentenceClosedRef = useRef(false);

  const firmWord = useCallback((word, confidence) => {
    const current = wordsRef.current;
    if (current.length > 0 && current[current.length - 1] === word) {
      // repeat of the last word (same sign predicted across two segments)
      setTentative(null);
      return;
    }
    wordsRef.current = [...current, word];
    setWords(wordsRef.current);
    setTentative(null);
  }, []);

  const handlePredictions = useCallback(
    (predictions) => {
      pendingRef.current -= 1;
      const top = predictions && predictions[0];
      if (top) {
        if (top.confidence >= CONFIDENCE_FIRM) {
          firmWord(top.word, top.confidence);
        } else if (top.confidence >= CONFIDENCE_TENTATIVE) {
          setTentative({ word: top.word, confidence: top.confidence });
        }
      }
      maybeFinishSentence();
    },
    [firmWord]
  );

  const predictViaServer = useCallback(
    (frames) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.translateGestureSample(
          token,
          modelId,
          frames,
          function (res) {
            handlePredictions(res && res.predictions);
          }
        );
      } catch (err) {
        pendingRef.current -= 1;
        console.error("translateGestureSample failed:", err);
      }
    },
    [token, modelId, handlePredictions]
  );

  const predictSegment = useCallback(
    (frames) => {
      pendingRef.current += 1;
      if (localModel.ready) {
        localModel
          .predict(frames)
          .then((predictions) => handlePredictions(predictions))
          .catch((err) => {
            console.warn("Local inference failed, retrying via server:", err);
            predictViaServer(frames);
          });
      } else {
        predictViaServer(frames);
      }
    },
    [localModel, handlePredictions, predictViaServer]
  );

  const flushSegment = useCallback(() => {
    const frames = bufferRef.current;
    bufferRef.current = [];
    lowVelCountRef.current = 0;
    if (frames.length >= MIN_SEGMENT_FRAMES) {
      predictSegment(frames);
    }
  }, [predictSegment]);

  function speakSentence(gloss) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.smoothGlossToEnglish(
        token,
        gloss,
        function (res) {
          const text = (res && res.text) || gloss.join(" ");
          dispatch(setSpeakText(text));
          dispatch(setIsSpeaking(true));
        }
      );
    } catch (err) {
      // no LLM smoothing available: speak the raw gloss
      dispatch(setSpeakText(gloss.join(" ")));
      dispatch(setIsSpeaking(true));
    }
  }

  // Close the sentence once the pause was long enough AND no prediction is
  // still in flight (so a late segment can't be dropped from the sentence).
  function maybeFinishSentence() {
    if (!sentenceClosedRef.current || pendingRef.current > 0) return;
    const gloss = wordsRef.current;
    sentenceClosedRef.current = false;
    if (gloss.length === 0) return;
    wordsRef.current = [];
    setWords([]);
    setTentative(null);
    speakSentence(gloss);
  }

  // Fed each processed camera frame by useHolisticModel({ onFrame }).
  const onFrame = useCallback(
    (data) => {
      const hasHand = data.leftHandLandmarks || data.rightHandLandmarks;

      if (!hasHand) {
        noHandCountRef.current += 1;
        lastWristRef.current = null;
        if (noHandCountRef.current === NO_HAND_BOUNDARY_FRAMES) {
          flushSegment();
          setIsSigning(false);
          dispatch(setIsRecording(false));
        }
        if (noHandCountRef.current === NO_HAND_SENTENCE_FRAMES) {
          sentenceClosedRef.current = true;
          maybeFinishSentence();
        }
        return;
      }

      noHandCountRef.current = 0;
      sentenceClosedRef.current = false;
      if (!isSigning) {
        setIsSigning(true);
        dispatch(setIsRecording(true));
      }

      bufferRef.current.push({ t: Date.now(), data });

      // wrist velocity in normalized image coordinates
      const wrist = wristOf(data);
      const last = lastWristRef.current;
      if (wrist && last) {
        const v = Math.hypot(wrist.x - last.x, wrist.y - last.y);
        if (v < VELOCITY_THRESHOLD) {
          lowVelCountRef.current += 1;
        } else {
          lowVelCountRef.current = 0;
        }
      }
      lastWristRef.current = wrist;

      const len = bufferRef.current.length;
      if (
        (lowVelCountRef.current >= LOW_VELOCITY_FRAMES && len >= MIN_SEGMENT_FRAMES) ||
        len >= MAX_SEGMENT_FRAMES
      ) {
        flushSegment();
      }
    },
    [flushSegment, isSigning, dispatch]
  );

  const reset = useCallback(() => {
    bufferRef.current = [];
    wordsRef.current = [];
    lowVelCountRef.current = 0;
    noHandCountRef.current = 0;
    pendingRef.current = 0;
    sentenceClosedRef.current = false;
    setWords([]);
    setTentative(null);
    setIsSigning(false);
  }, []);

  return { onFrame, words, tentative, isSigning, reset, isLocal: localModel.ready };
}

export default useContinuousTranslator;
