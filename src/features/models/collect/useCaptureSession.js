import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MAX_SECONDS, reviewTake, stopReason, trimTake } from "./captureLogic";

/**
 * One recording session for a word or phrase.
 *
 *   idle -> countdown (3 s) -> recording -> review -> saving -> idle
 *
 * Feed it frames with `onFrame` (from useLandmarker). Recording stops on its own when the take
 * reaches its length, when the hands drop after signing, or after 5 s without hands (with a
 * hint). Nothing leaves the browser until Keep. `save(frames)` must resolve
 * { sampleCount, captureId } or reject; `undo(captureId)` undoes a kept take.
 *
 * kept: this session's takes, newest first: { id, captureId, frames, at, undone }.
 */
export default function useCaptureSession({ save, undo, maxSeconds = DEFAULT_MAX_SECONDS, countdownSeconds = 3 }) {
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState(null); // { frames, review }
  const [notice, setNotice] = useState(null); // { type: info|error, text }
  const [kept, setKept] = useState([]);
  const [lastCount, setLastCount] = useState(null);

  const phaseRef = useRef("idle");
  const framesRef = useRef([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const takeIdRef = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;
  const undoRef = useRef(undo);
  undoRef.current = undo;
  const maxMs = Math.round(maxSeconds * 1000);

  const go = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(tickRef.current);
    timerRef.current = null;
    tickRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finishRecording = useCallback(
    (reason) => {
      if (phaseRef.current !== "recording") return;
      clearTimers();
      const trimmed = trimTake(framesRef.current);
      if (reason === "no-hands" || trimmed.length === 0) {
        framesRef.current = [];
        setNotice({ type: "info", text: "We didn't see your hands. Step back so both hands are in view, then try again." });
        go("idle");
        return;
      }
      setTake({ frames: trimmed, review: reviewTake(trimmed) });
      go("review");
    },
    [clearTimers, go]
  );

  /** Feed every camera frame here. */
  const onFrame = useCallback(
    (data, meta) => {
      if (phaseRef.current !== "recording") return;
      const t = meta?.timestamp ?? Date.now();
      framesRef.current.push({ t, data });
      const reason = stopReason(framesRef.current, startedAtRef.current, t, maxMs);
      if (reason) finishRecording(reason);
    },
    [finishRecording, maxMs]
  );

  const start = useCallback(() => {
    if (phaseRef.current === "countdown" || phaseRef.current === "recording" || phaseRef.current === "saving") return;
    clearTimers();
    setNotice(null);
    setTake(null);
    framesRef.current = [];
    setElapsed(0);
    let remaining = countdownSeconds;
    setCountdown(remaining);
    go("countdown");
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }
      clearInterval(timerRef.current);
      startedAtRef.current = Date.now();
      go("recording");
      // Frames may stop arriving (camera hiccup): the clock still ends the take.
      tickRef.current = setInterval(() => {
        const now = Date.now();
        setElapsed(now - startedAtRef.current);
        const reason = stopReason(framesRef.current, startedAtRef.current, now, maxMs);
        if (reason) finishRecording(reason);
      }, 100);
    }, 1000);
  }, [clearTimers, countdownSeconds, finishRecording, go, maxMs]);

  const cancel = useCallback(() => {
    clearTimers();
    framesRef.current = [];
    setTake(null);
    go("idle");
  }, [clearTimers, go]);

  const discard = cancel;

  const keep = useCallback(async () => {
    if (phaseRef.current !== "review" || !take || take.review.problems.length) return false;
    go("saving");
    setNotice(null);
    try {
      const result = await saveRef.current(take.frames);
      takeIdRef.current += 1;
      setKept((list) => [
        { id: takeIdRef.current, captureId: result?.captureId || null, frames: take.frames, at: Date.now(), undone: false },
        ...list,
      ]);
      if (Number.isFinite(result?.sampleCount)) setLastCount(result.sampleCount);
      setTake(null);
      go("idle");
      return true;
    } catch (err) {
      setNotice({ type: "error", text: err?.userMessage || "We couldn't save that take. Check your connection and press Keep again." });
      go("review");
      return false;
    }
  }, [go, take]);

  const undoTake = useCallback(async (id) => {
    const entry = kept.find((k) => k.id === id);
    if (!entry || entry.undone || !entry.captureId || !undoRef.current) return false;
    try {
      await undoRef.current(entry.captureId);
      setKept((list) => list.map((k) => (k.id === id ? { ...k, undone: true } : k)));
      setLastCount((n) => (Number.isFinite(n) ? Math.max(0, n - 1) : n));
      return true;
    } catch (err) {
      setNotice({ type: "error", text: err?.userMessage || "We couldn't undo that take." });
      return false;
    }
  }, [kept]);

  /** Start over for another word: forget this session's takes (they stay saved). */
  const resetSession = useCallback(() => {
    cancel();
    setKept([]);
    setLastCount(null);
    setNotice(null);
  }, [cancel]);

  return {
    phase,
    countdown,
    elapsed,
    maxMs,
    take,
    notice,
    kept,
    lastCount,
    onFrame,
    start,
    cancel,
    discard,
    keep,
    undoTake,
    resetSession,
    busy: phase === "countdown" || phase === "recording" || phase === "saving",
  };
}
