import { useCallback, useEffect, useRef, useState } from "react";
import { findShotIndexForTime, needsResync, nextShotAfter, shotOffset } from "../sync";
import { YouTubePlayerController, YT_STATE } from "../YouTubePlayerController";

const TICK_MS = 200;

/**
 * Plays the recorded signer in step with the YouTube video.
 *
 * The signer <video> is always muted (segments carry no audio), so browsers let it play even
 * when playback started inside YouTube's cross-origin iframe. Segments are compared by id, never
 * by src (src is normalised by the browser). Drift is corrected only past a tolerance, so the
 * signer doesn't stutter. If a browser still refuses play(), needsTap asks for one tap.
 */
export default function useSignerSync({ videoId, shots }) {
  const containerRef = useRef(null);
  const signerRef = useRef(null);
  const prefetchRef = useRef(null);
  const playerRef = useRef(null);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const currentShotId = useRef(null);
  const tickRef = useRef(null);
  const ytState = useRef(YT_STATE.UNSTARTED);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeShotId, setActiveShotId] = useState(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [signerError, setSignerError] = useState(null);

  const playSigner = useCallback(() => {
    const v = signerRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.then(() => setNeedsTap(false)).catch((err) => {
        if (err?.name === "NotAllowedError") setNeedsTap(true);
      });
    }
  }, []);

  const pauseSigner = useCallback(() => {
    const v = signerRef.current;
    if (v && !v.paused) v.pause();
  }, []);

  const sync = useCallback(() => {
    const player = playerRef.current;
    const v = signerRef.current;
    if (!player || !v) return;
    const t = player.getCurrentTime();
    setTime(t);
    const list = shotsRef.current || [];
    const index = findShotIndexForTime(list, t);
    const isPlaying = ytState.current === YT_STATE.PLAYING;
    if (index < 0) {
      if (currentShotId.current !== null) {
        currentShotId.current = null;
        setActiveShotId(null);
        pauseSigner();
      }
    } else {
      const shot = list[index];
      const offset = shotOffset(shot, t);
      if (currentShotId.current !== shot.id) {
        currentShotId.current = shot.id;
        setActiveShotId(shot.id);
        setSignerError(null);
        v.src = shot.videoUrl;
        v.playbackRate = player.getPlaybackRate() || 1;
        const start = () => {
          if (currentShotId.current !== shot.id) return;
          try {
            v.currentTime = shotOffset(shot, playerRef.current?.getCurrentTime() ?? t);
          } catch {
            // not seekable yet; the next tick corrects it
          }
          if (ytState.current === YT_STATE.PLAYING) playSigner();
        };
        v.addEventListener("loadedmetadata", start, { once: true });
        v.load();
        const next = nextShotAfter(list, shot.endTime - 0.01);
        if (prefetchRef.current && next && prefetchRef.current.dataset.shotId !== next.id) {
          prefetchRef.current.dataset.shotId = next.id;
          prefetchRef.current.src = next.videoUrl;
        }
      } else if (v.readyState >= 1) {
        if (isPlaying && v.paused) playSigner();
        if (!isPlaying && !v.paused) pauseSigner();
        if (needsResync(v.currentTime, offset)) {
          try {
            v.currentTime = offset;
          } catch {
            // ignore; retried next tick
          }
        }
      }
    }
  }, [pauseSigner, playSigner]);

  const startTicking = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(sync, TICK_MS);
  }, [sync]);

  const stopTicking = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  useEffect(() => {
    if (!videoId || !containerRef.current) return undefined;
    const controller = new YouTubePlayerController(containerRef.current, {
      playerVars: { controls: 1, fs: 0, cc_load_policy: 0, iv_load_policy: 3 },
      onStateChange: (event) => {
        ytState.current = event.data;
        if (event.data === YT_STATE.PLAYING) {
          setPlaying(true);
          startTicking();
          sync();
        } else {
          setPlaying(false);
          pauseSigner();
          sync();
          if (event.data === YT_STATE.ENDED || event.data === YT_STATE.PAUSED) stopTicking();
        }
      },
      onPlaybackRateChange: (event) => {
        if (signerRef.current) signerRef.current.playbackRate = event?.data || 1;
      },
      onError: (info) => setError(info.message),
    });
    playerRef.current = controller;
    controller
      .load(videoId)
      .then(() => {
        setReady(true);
        sync();
      })
      .catch((err) => setError(err.message));
    return () => {
      stopTicking();
      controller.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId, pauseSigner, startTicking, stopTicking, sync]);

  // New segment list (refetch): re-evaluate which segment is showing.
  useEffect(() => {
    currentShotId.current = null;
    sync();
  }, [shots, sync]);

  const onSignerError = useCallback(() => {
    setSignerError("This part of the signing couldn't load.");
  }, []);

  return {
    containerRef,
    signerRef,
    prefetchRef,
    player: playerRef,
    ready,
    error,
    time,
    playing,
    activeShotId,
    needsTap,
    signerError,
    tapToPlay: playSigner,
    onSignerError,
    seekTo: (s) => playerRef.current?.seekTo(s),
  };
}
