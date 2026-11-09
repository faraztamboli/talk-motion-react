import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sessionToken, rpc } from "../../../api/rpc";
import { RecordingEngine } from "../RecordingEngine";
import { YouTubePlayerController, YT_STATE } from "../YouTubePlayerController";
import { detectJump } from "../playbackWatch";
import { recordingsApi, useCreateRecordingMutation, useLazyGetYouTubeMetadataQuery } from "../recordingsApi";
import { parseYouTubeVideoId } from "../../../utils/youtubeUrl";

const POLL_MS = 500;

/**
 * Everything the Subtitle Designer page needs, in one hook:
 *
 *  candidate   the video being considered (checked with YouTube before anything is created)
 *  recording   the committed recording ({ id, videoId }); created only when the author chooses
 *              the video, and a new one for every new video
 *  player      { ready, error, time, duration, playing }
 *  engine      engineState and segments (local), plus serverShots already on the server
 *
 * The camera stream is passed in (useRecorderCamera); the page owns the camera.
 */
export default function useDesignerSession({ existingRecordingId, stream, dispatch }) {
  const token = sessionToken();
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const engineRef = useRef(null);
  const sampleRef = useRef(null);
  const pollRef = useRef(null);
  const loadSeq = useRef(0);

  const [candidate, setCandidate] = useState(null); // { videoId, status, meta, error }
  const [recording, setRecording] = useState(null); // { id, videoId }
  const [engineState, setEngineState] = useState("idle");
  const [segments, setSegments] = useState([]);
  const [player, setPlayer] = useState({ ready: false, error: null, time: 0, duration: 0, playing: false });
  const [notice, setNotice] = useState(null); // { type, message } shown until dismissed
  const [loadingExisting, setLoadingExisting] = useState(Boolean(existingRecordingId));

  const [checkMetadata] = useLazyGetYouTubeMetadataQuery();
  const [createRecording, createState] = useCreateRecordingMutation();

  const say = useCallback((type, message) => setNotice({ type, message, at: Date.now() }), []);

  // ------------------------------------------------------------------ engine

  const engine = useMemo(() => {
    const e = new RecordingEngine({
      token,
      deleteShot: (shotId) => rpc("deleteVideoRecordingShot", [sessionToken(), Number(shotId)]),
    });
    e.addEventListener("statechange", (ev) => setEngineState(ev.detail.state));
    e.addEventListener("segmentschange", (ev) => setSegments(ev.detail.segments));
    e.addEventListener("error", (ev) => setNotice({ type: "error", message: ev.detail.message, at: Date.now() }));
    return e;
  }, []);
  engineRef.current = engine;

  useEffect(() => {
    engine.setStream(stream || null);
  }, [engine, stream]);

  // ------------------------------------------------------------------ player

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
    sampleRef.current = null;
  }, []);

  const sample = useCallback(() => {
    const p = playerRef.current;
    if (!p) return null;
    return { videoTime: p.getCurrentTime(), realTime: Date.now(), rate: p.getPlaybackRate() || 1 };
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    sampleRef.current = sample();
    pollRef.current = setInterval(async () => {
      const p = playerRef.current;
      const e = engineRef.current;
      if (!p || !e) return;
      const now = sample();
      setPlayer((prev) => ({ ...prev, time: now.videoTime }));
      if (e.state === "recording") {
        const jump = detectJump(sampleRef.current, now);
        sampleRef.current = now;
        if (jump) {
          await e.split(jump.endTime, jump.newStartTime);
          setNotice({ type: "info", message: "The video jumped, so a new segment started there.", at: Date.now() });
          return;
        }
        await e.tick(now.videoTime);
      } else {
        sampleRef.current = now;
      }
    }, POLL_MS);
  }, [sample]);

  const handleStateChange = useCallback(
    async (event) => {
      const p = playerRef.current;
      const e = engineRef.current;
      if (!p || !e) return;
      const t = p.getCurrentTime();
      if (event.data === YT_STATE.PLAYING) {
        setPlayer((prev) => ({ ...prev, playing: true, duration: p.getDuration() || prev.duration }));
        startPolling();
        if (e.isArmed() && e.state !== "recording") {
          if (p.getPlaybackRate() !== 1) p.setPlaybackRate(1);
          await e.startSegment(t);
        }
      } else if (event.data === YT_STATE.PAUSED || event.data === YT_STATE.BUFFERING) {
        setPlayer((prev) => ({ ...prev, playing: event.data !== YT_STATE.PAUSED && prev.playing }));
        if (e.state === "recording") await e.stopSegment(t);
        if (event.data === YT_STATE.PAUSED) stopPolling();
      } else if (event.data === YT_STATE.ENDED) {
        setPlayer((prev) => ({ ...prev, playing: false }));
        stopPolling();
        if (e.state === "recording") await e.stopSegment(p.getDuration() || t);
      } else if (event.data === YT_STATE.CUED) {
        setPlayer((prev) => ({ ...prev, duration: p.getDuration() || prev.duration }));
      }
    },
    [startPolling, stopPolling]
  );

  const handlePlayerError = useCallback(
    (info) => {
      setPlayer((prev) => ({ ...prev, error: info }));
      setCandidate((prev) => (prev ? { ...prev, status: "error", error: info.message } : prev));
      const e = engineRef.current;
      if (e?.state === "recording") e.stopSegment(playerRef.current?.getCurrentTime() || 0);
    },
    []
  );

  const handleRateChange = useCallback((event) => {
    const e = engineRef.current;
    if (e?.isArmed() && event?.data !== 1) {
      playerRef.current?.setPlaybackRate(1);
      setNotice({ type: "info", message: "While recording, the video plays at normal speed so your signing stays in sync.", at: Date.now() });
    }
  }, []);

  const getPlayer = useCallback(() => {
    if (!playerRef.current && playerContainerRef.current) {
      playerRef.current = new YouTubePlayerController(playerContainerRef.current, {
        onStateChange: handleStateChange,
        onError: handlePlayerError,
        onPlaybackRateChange: handleRateChange,
      });
    }
    return playerRef.current;
  }, [handlePlayerError, handleRateChange, handleStateChange]);

  const showInPlayer = useCallback(
    async (videoId) => {
      // The container mounts with the candidate; wait a frame for it.
      for (let i = 0; i < 10 && !playerContainerRef.current; i += 1) {
        await new Promise((r) => setTimeout(r, 30));
      }
      const p = getPlayer();
      if (!p) throw new Error("The player area isn't ready");
      setPlayer((prev) => ({ ...prev, error: null }));
      await p.load(videoId);
      setPlayer((prev) => ({ ...prev, ready: true, duration: p.getDuration() || prev.duration, time: 0 }));
    },
    [getPlayer]
  );

  // ------------------------------------------------------------------ choose a video

  /** Check a video with YouTube and show it in the player. Creates nothing on the server. */
  const checkVideo = useCallback(
    async (urlOrId, hint = {}) => {
      const videoId = parseYouTubeVideoId(urlOrId || "");
      const seq = ++loadSeq.current;
      if (!videoId) {
        setCandidate({ videoId: null, status: "error", error: "That isn't a YouTube video link." });
        return false;
      }
      if (engineRef.current?.state === "recording") await engineRef.current.disarm(playerRef.current?.getCurrentTime() || 0);
      setCandidate({ videoId, status: "checking", meta: { title: hint.title || null, author: hint.author || null }, error: null });
      const { data, error } = await checkMetadata(videoId, true);
      if (seq !== loadSeq.current) return false;
      if (error) {
        setCandidate({ videoId, status: "error", error: error.message });
        return false;
      }
      if (data.embeddable === false || data.exists === false) {
        setCandidate({ videoId, status: "error", meta: data, error: data.reason || "This video can't be played here." });
        return false;
      }
      const meta = { ...data, title: data.title || hint.title || null, author: data.author || hint.author || null, description: hint.description || "" };
      setCandidate({ videoId, status: "loading", meta, error: null });
      try {
        await showInPlayer(videoId);
      } catch (err) {
        if (seq !== loadSeq.current) return false;
        setCandidate({ videoId, status: "error", meta, error: err.message });
        return false;
      }
      if (seq !== loadSeq.current) return false;
      setCandidate({ videoId, status: "ready", meta, error: null });
      return true;
    },
    [checkMetadata, showInPlayer]
  );

  const setRecordingUrl = (id) => {
    try {
      // Same page, new URL: a reload resumes this recording. (A router navigation would
      // remount the page and drop the player and camera.)
      window.history.replaceState(window.history.state, "", `/video-subtitles/designer/${id}`);
    } catch {
      // ignore
    }
  };

  /** Create the recording for the current candidate. */
  const commitVideo = useCallback(
    async ({ title, description }) => {
      if (!candidate || candidate.status !== "ready") return null;
      const p = playerRef.current;
      const { data, error } = await createRecording({
        title: title?.trim() || candidate.meta?.title || "",
        description: description || "",
        videoId: candidate.videoId,
        youtubeTitle: candidate.meta?.title || p?.getVideoData()?.title || null,
        youtubeAuthor: candidate.meta?.author || p?.getVideoData()?.author || null,
        duration: p?.getDuration() || null,
      });
      if (error) {
        say("error", error.message);
        return null;
      }
      const next = { id: data.id, videoId: candidate.videoId };
      engineRef.current.setRecordingId(data.id);
      setRecording(next);
      setRecordingUrl(data.id);
      return next;
    },
    [candidate, createRecording, say]
  );

  /** Start over with another video (the next one gets its own recording). */
  const changeVideo = useCallback(async () => {
    const e = engineRef.current;
    if (e?.isArmed()) await e.disarm(playerRef.current?.getCurrentTime() || 0);
    playerRef.current?.pause();
    setRecording(null);
    setCandidate(null);
    loadSeq.current += 1;
    try {
      window.history.replaceState(window.history.state, "", "/video-subtitles/designer");
    } catch {
      // ignore
    }
  }, []);

  // ------------------------------------------------------------------ edit mode

  useEffect(() => {
    if (!existingRecordingId) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingExisting(true);
      const subscription = dispatch(recordingsApi.endpoints.getRecordingDetails.initiate(String(existingRecordingId)));
      const result = await subscription;
      subscription.unsubscribe?.();
      const details = result?.data;
      if (cancelled) return;
      if (!details) {
        setLoadingExisting(false);
        say("error", result?.error?.message || "This recording couldn't be opened.");
        return;
      }
      if (!details.canEdit) {
        setLoadingExisting(false);
        say("error", "Only the person who made this recording can edit it.");
        setRecording({ id: details.recording.id, videoId: details.recording.videoId, readOnly: true });
        return;
      }
      engineRef.current.setRecordingId(details.recording.id);
      setRecording({ id: details.recording.id, videoId: details.recording.videoId });
      const meta = { title: details.recording.youtubeTitle, author: details.recording.youtubeAuthor };
      if (details.recording.videoId) {
        setCandidate({ videoId: details.recording.videoId, status: "loading", meta, error: null });
        try {
          await showInPlayer(details.recording.videoId);
          if (!cancelled) setCandidate({ videoId: details.recording.videoId, status: "ready", meta, error: null });
        } catch (err) {
          if (!cancelled) setCandidate({ videoId: details.recording.videoId, status: "error", meta, error: err.message });
        }
      }
      const restored = await engineRef.current.restorePending(details.recording.id);
      if (restored && !cancelled) say("info", `Uploading ${restored} segment${restored === 1 ? "" : "s"} that hadn't finished before.`);
      if (!cancelled) setLoadingExisting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [existingRecordingId]);

  // ------------------------------------------------------------------ actions

  const arm = useCallback(() => {
    const ok = engineRef.current.arm();
    if (ok) {
      playerRef.current?.setPlaybackRate(1);
      say("info", "Recording is on. Play the video to record; pause to finish a segment.");
    }
    return ok;
  }, [say]);

  const disarm = useCallback(async () => {
    playerRef.current?.pause();
    await engineRef.current.disarm(playerRef.current?.getCurrentTime() || 0);
  }, []);

  const seekTo = useCallback((seconds) => playerRef.current?.seekTo(seconds), []);
  const currentTimeMs = useCallback(() => Math.round((playerRef.current?.getCurrentTime() || 0) * 1000), []);
  const play = useCallback(() => playerRef.current?.play(), []);
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const retry = useCallback((localId) => engineRef.current.retry(localId), []);
  const removeSegment = useCallback((localId) => engineRef.current.remove(localId), []);
  const hasPendingWork = useCallback(() => engineRef.current?.hasPendingWork() || false, []);

  // ------------------------------------------------------------------ teardown

  useEffect(
    () => () => {
      stopPolling();
      const time = playerRef.current?.getCurrentTime() || null;
      engineRef.current?.destroy(time);
      playerRef.current?.destroy();
      playerRef.current = null;
    },
    [stopPolling]
  );

  return {
    playerContainerRef,
    candidate,
    recording,
    player,
    engineState,
    segments,
    isArmed: engineState === "armed" || engineState === "recording",
    canRecord: Boolean(stream && recording && !recording.readOnly),
    notice,
    dismissNotice: () => setNotice(null),
    loadingExisting,
    creating: createState.isLoading,
    checkVideo,
    commitVideo,
    changeVideo,
    arm,
    disarm,
    retry,
    removeSegment,
    seekTo,
    play,
    pause,
    currentTimeMs,
    hasPendingWork,
  };
}
