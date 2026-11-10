import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { currentItem, initialQueue, queueReducer } from "./playlist";
import { readPref, writePref } from "./prefs";

export const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * Plays sign videos one after another in a single <video> element.
 *
 * The element is never swapped (fullscreen uses the Fullscreen API on its container), so
 * `ended` always fires and the queue can't stall. Videos are muted: sign clips carry no
 * meaningful audio, and muted autoplay is always allowed. A clip that fails to load is skipped
 * and listed in `failed`.
 *
 *   const q = useSignVideoQueue();
 *   <video ref={q.videoRef} onEnded={q.onEnded} onError={q.onError} muted playsInline />
 */
export default function useSignVideoQueue() {
  const videoRef = useRef(null);
  const [state, dispatch] = useReducer(queueReducer, initialQueue);
  const [speed, setSpeedState] = useState(() => {
    const saved = readPref("speed", 1);
    return SPEEDS.includes(saved) ? saved : 1;
  });
  const [failed, setFailed] = useState([]);
  const [needsTap, setNeedsTap] = useState(false);
  const current = currentItem(state);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!current) {
      if (!video.paused) video.pause();
      return;
    }
    setNeedsTap(false);
    video.muted = true;
    video.src = current.url;
    video.playbackRate = speedRef.current;
    const played = video.play?.();
    if (played && typeof played.catch === "function") {
      played.catch((err) => {
        // Only a real autoplay refusal needs a tap; an aborted load is followed by onError.
        if (err?.name === "NotAllowedError") setNeedsTap(true);
      });
    }
  }, [current?.id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const enqueue = useCallback((items) => {
    if (items?.length) {
      setFailed([]);
      dispatch({ type: "enqueue", items });
    }
  }, []);

  const stop = useCallback(() => {
    dispatch({ type: "stop" });
    setNeedsTap(false);
    const video = videoRef.current;
    if (video && video.src) {
      if (!video.paused) video.pause();
      video.removeAttribute("src");
      try {
        video.load(); // releases the clip
      } catch {
        // not supported here
      }
    }
  }, []);

  const resume = useCallback(() => {
    setNeedsTap(false);
    videoRef.current?.play?.()?.catch?.(() => setNeedsTap(true));
  }, []);

  const setSpeed = useCallback((s) => {
    setSpeedState(s);
    writePref("speed", s);
  }, []);

  const onEnded = useCallback(() => dispatch({ type: "ended" }), []);
  const onError = useCallback(() => {
    if (current) setFailed((f) => [...f, current.label]);
    dispatch({ type: "skip" });
  }, [current]);

  // Unmount: stop playback.
  useEffect(
    () => () => {
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
    },
    []
  );

  return {
    videoRef,
    current,
    playing: Boolean(current),
    upNext: state.index >= 0 ? state.items.slice(state.index + 1) : [],
    canReplay: state.lastBatch.length > 0,
    enqueue,
    stop,
    replay: useCallback(() => dispatch({ type: "replay" }), []),
    resume,
    needsTap,
    speed,
    setSpeed,
    onEnded,
    onError,
    failed,
  };
}
