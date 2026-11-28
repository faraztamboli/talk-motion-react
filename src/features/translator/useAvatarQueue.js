import { useCallback, useEffect, useRef, useState } from "react";
import { framesForItem, lerpFrame } from "./avatarFrames";

/** After the last sign, the avatar holds its last frame this long, then relaxes. */
export const HOLD_MS = 800;

/**
 * Plays avatar pose items one after another, with short blends between signs.
 * Items: { label, frames, fps, mirrored } (getConceptPoses). `frame` is the frame to draw, in
 * viewer orientation; `label` is the word being signed.
 *
 * `frame` changes at the clip's frame rate (25 a second at most). A view that draws on every
 * screen refresh calls `sample(now)` instead: the frame blended between the current frame and
 * the next by the time since the current one was shown, so motion is smooth, not stepped. It is
 * null when nothing is playing and the hold after the last sign is over.
 */
export default function useAvatarQueue({ speed = 1 } = {}) {
  const [frame, setFrame] = useState(null);
  const [label, setLabel] = useState(null);
  const [playing, setPlaying] = useState(false);
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const lastFrameRef = useRef(null);
  const playingRef = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  // What sample() blends: the frame shown, the one after it, when it was shown and for how long
  const clockRef = useRef({ current: null, next: null, at: 0, ms: 1, endedAt: 0 });

  const playNext = useCallback(() => {
    const item = queueRef.current.shift();
    if (!item) {
      playingRef.current = false;
      clockRef.current = { ...clockRef.current, next: null, endedAt: performance.now() };
      setPlaying(false);
      setLabel(null);
      return;
    }
    playingRef.current = true;
    setPlaying(true);
    setLabel(item.label || item.word || null);
    // Once the avatar has relaxed, the next sentence starts from rest, not from the last sign
    const { endedAt } = clockRef.current;
    if (endedAt && performance.now() - endedAt > HOLD_MS) lastFrameRef.current = null;
    const frames = framesForItem(item, lastFrameRef.current);
    const fps = Math.max(5, Math.min(30, Number(item.fps) || 15));
    let index = 0;
    const step = () => {
      if (index >= frames.length) {
        if (frames.length) lastFrameRef.current = frames[frames.length - 1];
        playNext();
        return;
      }
      const ms = 1000 / (fps * speedRef.current);
      clockRef.current = { current: frames[index], next: frames[index + 1] || null, at: performance.now(), ms, endedAt: 0 };
      setFrame(frames[index]);
      index += 1;
      timerRef.current = setTimeout(step, ms);
    };
    step();
  }, []);

  const enqueue = useCallback(
    (items) => {
      const playable = (items || []).filter((i) => Array.isArray(i?.frames) && i.frames.length > 0);
      if (!playable.length) return;
      queueRef.current.push(...playable);
      if (!playingRef.current) playNext();
    },
    [playNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    clearTimeout(timerRef.current);
    timerRef.current = null;
    playingRef.current = false;
    lastFrameRef.current = null;
    clockRef.current = { current: null, next: null, at: 0, ms: 1, endedAt: 0 };
    setPlaying(false);
    setLabel(null);
    setFrame(null);
  }, []);

  const sample = useCallback((now = performance.now()) => {
    const c = clockRef.current;
    if (!c.current) return null;
    if (c.endedAt && now - c.endedAt > HOLD_MS) return null;
    if (!c.next) return c.current;
    const w = Math.max(0, Math.min(1, (now - c.at) / c.ms));
    return w <= 0 ? c.current : lerpFrame(c.current, c.next, w);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { frame, label, playing, enqueue, stop, sample };
}
