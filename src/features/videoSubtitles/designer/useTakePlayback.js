import { useEffect, useRef, useState } from "react";
import { findShotIndexForTime, needsResync, shotOffset } from "../sync";
import { YT_STATE } from "../YouTubePlayerController";

const TICK_MS = 200;

/**
 * "Watch back" in the designer: plays the take that covers the video's current time in a
 * <video> over the designer's own YouTube player, in step with it.
 *
 * takes: [{ id, startTime, endTime, videoUrl }] where a newer take has a larger numeric id
 * (it wins where takes overlap, as in the viewer). Local takes play from their in-memory copy,
 * so a take can be watched the moment it is recorded, before it has finished uploading.
 */
export default function useTakePlayback({ getPlayer, takes, active }) {
  const videoRef = useRef(null);
  const takesRef = useRef(takes);
  takesRef.current = takes;
  const current = useRef(null); // { id, src }
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!active) {
      if (v && !v.paused) v.pause();
      current.current = null;
      setActiveId(null);
      return undefined;
    }

    const play = () => {
      const p = videoRef.current?.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const tick = () => {
      const player = getPlayer();
      const video = videoRef.current;
      if (!player || !video) return;
      const t = player.getCurrentTime() || 0;
      const playing = player.getState() === YT_STATE.PLAYING;
      const list = takesRef.current || [];
      const index = findShotIndexForTime(list, t);
      if (index < 0) {
        if (current.current) {
          current.current = null;
          setActiveId(null);
          if (!video.paused) video.pause();
        }
        return;
      }
      const take = list[index];
      const offset = shotOffset(take, t);
      if (!current.current || current.current.id !== take.id || current.current.src !== take.videoUrl) {
        current.current = { id: take.id, src: take.videoUrl };
        setActiveId(take.id);
        video.src = take.videoUrl;
        const start = () => {
          if (current.current?.id !== take.id) return;
          try {
            video.currentTime = shotOffset(take, getPlayer()?.getCurrentTime() ?? t);
          } catch {
            // not seekable yet; the next tick corrects it
          }
          if (getPlayer()?.getState() === YT_STATE.PLAYING) play();
        };
        video.addEventListener("loadedmetadata", start, { once: true });
        video.load();
        return;
      }
      if (video.readyState < 1) return;
      if (playing && video.paused) play();
      if (!playing && !video.paused) video.pause();
      if (needsResync(video.currentTime, offset)) {
        try {
          video.currentTime = offset;
        } catch {
          // retried next tick
        }
      }
    };

    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(timer);
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
    };
  }, [active, getPlayer]);

  return { videoRef, activeId };
}

/**
 * The takes the designer can play back: what is on the server, plus this session's recordings
 * (from their in-memory copy). Ranked so the newest take wins where takes overlap.
 */
export function playbackTakes(segments, serverShots) {
  const local = (segments || [])
    .filter((s) => s.previewUrl && s.end != null && s.end > s.start && ["queued", "uploading", "processing", "saved"].includes(s.status))
    .map((s) => ({
      id: String(s.shotId ? Number(s.shotId) : 1e12 + s.localId),
      startTime: s.start,
      endTime: s.end,
      videoUrl: s.previewUrl,
    }));
  const localShotIds = new Set((segments || []).map((s) => s.shotId).filter(Boolean).map(String));
  const server = (serverShots || [])
    .filter((s) => s.videoUrl && s.endTime > s.startTime && !localShotIds.has(String(s.id)))
    .map((s) => ({ id: String(s.id), startTime: s.startTime, endTime: s.endTime, videoUrl: s.videoUrl }));
  return [...server, ...local].sort((a, b) => a.startTime - b.startTime || Number(a.id) - Number(b.id));
}
