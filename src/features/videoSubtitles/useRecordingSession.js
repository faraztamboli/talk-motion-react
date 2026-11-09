import { useCallback, useEffect, useRef, useState } from "react";
import useLocalStorage from "../../hooks/useLocalStorage";
import truncateString, { truncateDescription } from "../../utils/truncateString";
import { parseYouTubeVideoId, watchUrlForVideoId } from "../../utils/youtubeUrl";
import {
  createVideoRecording,
  updateVideoRecording,
  getVideoRecording,
} from "../../api/talkmotionRecordings";
import { RecordingEngine } from "./RecordingEngine";
import { YouTubePlayerController } from "./YouTubePlayerController";

/**
 * The single React entry point for the subtitle-designer recording session.
 * Owns a RecordingEngine + YouTubePlayerController pair, translates their
 * events into React state, and guarantees full cleanup on unmount (camera
 * released, player destroyed, no timers left running).
 */
export default function useRecordingSession({ cameraVideoRef, playerContainerRef }) {
  const [token] = useLocalStorage("token");

  const [engineState, setEngineState] = useState("idle");
  const [shots, setShots] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [events, setEvents] = useState([]); // status-panel history
  const [recordingDbId, setRecordingDbId] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const engineRef = useRef(null);
  const playerRef = useRef(null);
  const metaSentRef = useRef(false);

  const logEvent = useCallback((type, message) => {
    setEvents((prev) =>
      [...prev, { id: Date.now() + Math.random(), time: new Date(), type, message }].slice(-100)
    );
  }, []);

  // ---- engine lifecycle -------------------------------------------------

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const engine = new RecordingEngine({ token });
      engine.addEventListener("statechange", (e) => setEngineState(e.detail.state));
      engine.addEventListener("shotschange", (e) => setShots(e.detail.shots));
      engine.addEventListener("error", (e) => {
        setLastError(e.detail);
        logEvent("error", e.detail.message);
      });
      engineRef.current = engine;
    }
    return engineRef.current;
  }, [token, logEvent]);

  useEffect(() => {
    return () => {
      // Full teardown: finalize any running shot, release camera, kill player.
      const engine = engineRef.current;
      const time = playerRef.current?.getCurrentTime?.() ?? null;
      engineRef.current = null;
      engine?.destroy(time);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // ---- player state handling ---------------------------------------------

  const handlePlayerStateChange = useCallback((event) => {
    const engine = engineRef.current;
    const player = playerRef.current;
    if (!engine || !player) return;
    const YTState = window.YT?.PlayerState;
    if (!YTState) return;

    if (event.data === YTState.PLAYING) {
      // Push original-video metadata once per loaded video.
      if (!metaSentRef.current && engine.recordingId) {
        metaSentRef.current = true;
        const data = player.getVideoData();
        updateVideoRecording(
          token,
          engine.recordingId,
          truncateString(data.title || ""),
          data.author || null,
          null,
          player.getDuration(),
          null,
          player.getPlaybackRate(),
          player.getPlaybackQuality()
        ).catch(() => {
          metaSentRef.current = false; // retry on next play
        });
      }
      setVideoDuration(player.getDuration());
      if (engine.isArmed() && engine.state !== "recording") {
        engine.startShot(player.getCurrentTime());
        logEvent("info", "Recording segment started");
      }
    } else if (event.data === YTState.PAUSED) {
      if (engine.state === "recording") {
        logEvent("info", "Segment finished — uploading");
        engine.stopShot(player.getCurrentTime());
      }
    } else if (event.data === YTState.ENDED) {
      if (engine.state === "recording") {
        logEvent("info", "Video ended — finalizing segment");
        engine.stopShot(player.getDuration() || player.getCurrentTime());
      }
    }
  }, [token, logEvent]);

  // ---- public actions -----------------------------------------------------

  /**
   * Load a YouTube video into the player, ensure the camera is on, and
   * create (or reuse) the server-side recording row.
   */
  const loadVideo = useCallback(
    async (urlOrId, title, description) => {
      const parsedId = parseYouTubeVideoId(urlOrId);
      if (!parsedId) {
        setLastError({ code: "bad-url", message: "Not a valid YouTube URL" });
        return null;
      }
      const engine = getEngine();

      if (!playerRef.current && playerContainerRef.current) {
        playerRef.current = new YouTubePlayerController(playerContainerRef.current, {
          onStateChange: handlePlayerStateChange,
        });
      }

      try {
        await playerRef.current.load(parsedId);
      } catch (err) {
        setLastError({ code: "player-failed", message: err.message });
        logEvent("error", `Could not load video: ${err.message}`);
        return null;
      }
      setVideoId(parsedId);
      metaSentRef.current = false;

      // Camera on (idempotent); errors surface via engine events.
      try {
        await engine.initCamera(cameraVideoRef.current);
      } catch {
        return null;
      }

      // Register the recording server-side once per video.
      if (!engine.recordingId) {
        try {
          const result = await createVideoRecording(
            token,
            truncateString(title || ""),
            truncateDescription(description || ""),
            watchUrlForVideoId(parsedId)
          );
          engine.setRecordingId(result.video_recording_id);
          setRecordingDbId(result.video_recording_id);
          logEvent("success", "Recording registered");
        } catch (err) {
          setLastError({ code: "create-failed", message: err.message });
          logEvent("error", `Could not register recording: ${err.message}`);
          return null;
        }
      }
      return engine.recordingId;
    },
    [token, getEngine, handlePlayerStateChange, cameraVideoRef, playerContainerRef, logEvent]
  );

  /** Load an existing recording (edit mode). Returns its metadata. */
  const loadExistingRecording = useCallback(
    async (existingRecordingId) => {
      try {
        const result = await getVideoRecording(token, existingRecordingId, true);
        const engine = getEngine();
        engine.setRecordingId(result.id ?? parseInt(existingRecordingId, 10));
        setRecordingDbId(engine.recordingId);
        return {
          title: result.title || "",
          description: result.description || "",
          youtubeURL: result.original_video_url || "",
          shots: result.recording_shots || [],
        };
      } catch (err) {
        setLastError({ code: "load-failed", message: err.message });
        logEvent("error", `Could not load recording: ${err.message}`);
        return null;
      }
    },
    [token, getEngine, logEvent]
  );

  const arm = useCallback(() => {
    const ok = getEngine().arm();
    if (ok) logEvent("info", "Recording enabled — play the video to record");
    return ok;
  }, [getEngine, logEvent]);

  const disarm = useCallback(async () => {
    playerRef.current?.pause();
    await getEngine().disarm(playerRef.current?.getCurrentTime() ?? null);
    logEvent("info", "Recording disabled");
  }, [getEngine, logEvent]);

  const retryUpload = useCallback(
    (localId) => getEngine().retryUpload(localId),
    [getEngine]
  );

  const updateDetails = useCallback(
    async (title, description) => {
      const id = engineRef.current?.recordingId;
      if (!id) return;
      try {
        await updateVideoRecording(token, id, truncateString(title || ""));
        logEvent("success", "Details saved");
      } catch (err) {
        logEvent("error", `Could not save details: ${err.message}`);
      }
    },
    [token, logEvent]
  );

  return {
    engineState,
    shots,
    lastError,
    events,
    recordingDbId,
    videoId,
    videoDuration,
    isArmed: engineState === "armed" || engineState === "recording",
    loadVideo,
    loadExistingRecording,
    arm,
    disarm,
    retryUpload,
    updateDetails,
    clearError: () => setLastError(null),
  };
}
