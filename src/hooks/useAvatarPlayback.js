import { useState, useRef, useCallback, useEffect } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

const TRANSITION_FRAMES = 6; // interpolated frames between consecutive signs

function lerpPoint(a, b, w) {
  return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
}

function lerpFrame(a, b, w) {
  const lerpBlock = (pa, pb) => pa.map((p, i) => lerpPoint(p, pb[i], w));
  return {
    lh: lerpBlock(a.lh, b.lh),
    rh: lerpBlock(a.rh, b.rh),
    pose: lerpBlock(a.pose, b.pose),
  };
}

/**
 * Signing-avatar playback: fetches recorded landmark sequences per concept
 * (getConceptPose, client-cached), queues them, and plays them frame by
 * frame with short pose-space interpolation between consecutive signs so
 * transitions blend instead of jumping. Concepts with no recorded sample
 * are skipped (the video pipeline's fingerspelling has no avatar equivalent
 * yet). Exposes the current frame for AvatarCanvas to render.
 */
function useAvatarPlayback({ modelId, speed = 1.0 }) {
  const [token] = useLocalStorage("token");
  const [currentFrame, setCurrentFrame] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const queueRef = useRef([]); // [{word, frames, fps}]
  const cacheRef = useRef({}); // concept -> {frames, fps} | null (known-missing)
  const timerRef = useRef(null);
  const lastFrameRef = useRef(null);
  const playingRef = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // model change: drop cache + queue
  useEffect(() => {
    cacheRef.current = {};
    queueRef.current = [];
    clearTimeout(timerRef.current);
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentFrame(null);
    setCurrentWord(null);
  }, [modelId]);

  const playNextInQueue = useCallback(() => {
    const item = queueRef.current.shift();
    if (!item) {
      playingRef.current = false;
      setIsPlaying(false);
      setCurrentWord(null);
      return;
    }
    playingRef.current = true;
    setIsPlaying(true);
    setCurrentWord(item.word);

    // blend from wherever the avatar currently is into the new sign
    let frames = item.frames;
    const last = lastFrameRef.current;
    if (last && frames.length > 0) {
      const transition = [];
      for (let i = 1; i <= TRANSITION_FRAMES; i++) {
        transition.push(lerpFrame(last, frames[0], i / (TRANSITION_FRAMES + 1)));
      }
      frames = [...transition, ...item.frames];
    }

    let index = 0;
    const interval = 1000 / (item.fps * speedRef.current);
    const step = () => {
      if (index >= frames.length) {
        lastFrameRef.current = frames[frames.length - 1] || lastFrameRef.current;
        playNextInQueue();
        return;
      }
      setCurrentFrame(frames[index]);
      index += 1;
      timerRef.current = setTimeout(step, interval);
    };
    step();
  }, []);

  const fetchPose = useCallback(
    (word) =>
      new Promise((resolve) => {
        if (word in cacheRef.current) {
          resolve(cacheRef.current[word]);
          return;
        }
        try {
          JS2Py.PythonFunctions.TalkMotionServer.getConceptPose(
            token,
            modelId,
            word,
            function (res) {
              const entry =
                res && res.frames && res.frames.length > 1
                  ? { frames: res.frames, fps: res.fps || 15 }
                  : null;
              cacheRef.current[word] = entry;
              resolve(entry);
            }
          );
        } catch (err) {
          console.error("getConceptPose failed:", err);
          resolve(null);
        }
      }),
    [token, modelId]
  );

  // Letter concepts exist under several dictionary spellings ("a", "_a_",
  // "_a") depending on how they were captured; try them in order.
  const fetchLetterPose = useCallback(
    async (letter) => {
      for (const key of [letter, `_${letter}_`, `_${letter}`]) {
        const pose = await fetchPose(key);
        if (pose) return pose;
      }
      return null;
    },
    [fetchPose]
  );

  /** Queue a gloss word sequence for avatar playback. Words with no pose
   * data are fingerspelled letter by letter when letter poses exist. */
  const enqueueWords = useCallback(
    async (words) => {
      for (const word of words) {
        const pose = await fetchPose(word);
        if (pose) {
          queueRef.current.push({ word, frames: pose.frames, fps: pose.fps });
        } else if (word.length > 1) {
          for (const letter of word.split("")) {
            const letterPose = await fetchLetterPose(letter);
            if (letterPose) {
              queueRef.current.push({
                word: `${letter} (${word})`,
                frames: letterPose.frames,
                fps: letterPose.fps,
              });
            }
          }
        }
      }
      // start only if idle (step() chains itself while playing)
      if (!playingRef.current && queueRef.current.length > 0) {
        playNextInQueue();
      }
    },
    [fetchPose, playNextInQueue]
  );

  const clear = useCallback(() => {
    queueRef.current = [];
    clearTimeout(timerRef.current);
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentWord(null);
  }, []);

  return { currentFrame, currentWord, isPlaying, enqueueWords, clear };
}

export default useAvatarPlayback;
