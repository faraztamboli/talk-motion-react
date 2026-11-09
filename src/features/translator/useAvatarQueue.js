import { useCallback, useEffect, useRef, useState } from "react";
import { framesForItem } from "./avatarFrames";

/**
 * Plays avatar pose items one after another, with short blends between signs.
 * Items: { label, frames, fps, mirrored } (getConceptPoses). `frame` is the frame to draw, in
 * viewer orientation; `label` is the word being signed.
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

  const playNext = useCallback(() => {
    const item = queueRef.current.shift();
    if (!item) {
      playingRef.current = false;
      setPlaying(false);
      setLabel(null);
      return;
    }
    playingRef.current = true;
    setPlaying(true);
    setLabel(item.label || item.word || null);
    const frames = framesForItem(item, lastFrameRef.current);
    const fps = Math.max(5, Math.min(30, Number(item.fps) || 15));
    let index = 0;
    const step = () => {
      if (index >= frames.length) {
        if (frames.length) lastFrameRef.current = frames[frames.length - 1];
        playNext();
        return;
      }
      setFrame(frames[index]);
      index += 1;
      timerRef.current = setTimeout(step, 1000 / (fps * speedRef.current));
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
    setPlaying(false);
    setLabel(null);
    setFrame(null);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { frame, label, playing, enqueue, stop };
}
