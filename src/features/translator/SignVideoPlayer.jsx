import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Segmented, Tooltip } from "antd";
import { MdFullscreen, MdFullscreenExit, MdPlayArrow, MdReplay, MdStop } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { SPEEDS } from "./useSignVideoQueue";

export function useFullscreen(ref) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onChange = () => setActive(Boolean(document.fullscreenElement) && document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [ref]);
  const supported = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ref.current?.requestFullscreen?.();
    } catch {
      // the browser refused; nothing to undo
    }
  };
  return { active, toggle, supported };
}

/** Sign clips from useSignVideoQueue, with stop, replay, speed and real fullscreen. */
export default function SignVideoPlayer({ queue, placeholder }) {
  const { t } = useTranslation();
  const stageRef = useRef(null);
  const fs = useFullscreen(stageRef);

  return (
    <div className="tm-tr-player">
      <div ref={stageRef} className={`tm-tr-stage ${fs.active ? "tm-tr-stage-full" : ""}`}>
        <video
          ref={queue.videoRef}
          className="tm-tr-video"
          muted
          playsInline
          preload="auto"
          onEnded={queue.onEnded}
          onError={queue.onError}
          aria-label={t("translator.signVideo", "Sign video")}
        />
        {!queue.playing && <div className="tm-tr-stage-placeholder">{placeholder}</div>}
        {queue.current && (
          <div className="tm-tr-stage-caption" aria-hidden>
            {queue.current.label}
          </div>
        )}
        {queue.needsTap && (
          <div className="tm-tr-stage-tap">
            <Button type="primary" icon={<MdPlayArrow aria-hidden />} onClick={queue.resume}>
              {t("translator.tapToPlay", "Play signs")}
            </Button>
          </div>
        )}
      </div>
      <div className="tm-tr-player-bar">
        <Tooltip title={t("translator.stopSigns", "Stop signing")}>
          <Button
            size="small"
            onClick={queue.stop}
            disabled={!queue.playing}
            icon={<MdStop aria-hidden />}
            aria-label={t("translator.stopSigns", "Stop signing")}
          />
        </Tooltip>
        <Tooltip title={t("translator.replay", "Replay the last sentence")}>
          <Button
            size="small"
            onClick={queue.replay}
            disabled={!queue.canReplay}
            icon={<MdReplay aria-hidden />}
            aria-label={t("translator.replay", "Replay the last sentence")}
          />
        </Tooltip>
        <Segmented
          size="small"
          value={queue.speed}
          onChange={queue.setSpeed}
          options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
          aria-label={t("translator.playbackSpeed", "Playback speed")}
        />
        {fs.supported && (
          <Tooltip title={fs.active ? t("translator.exitFullscreen", "Exit full screen") : t("translator.fullscreen", "Full screen")}>
            <Button
              size="small"
              onClick={fs.toggle}
              icon={fs.active ? <MdFullscreenExit aria-hidden /> : <MdFullscreen aria-hidden />}
              aria-label={fs.active ? t("translator.exitFullscreen", "Exit full screen") : t("translator.fullscreen", "Full screen")}
            />
          </Tooltip>
        )}
      </div>
      {queue.current && (
        <p className="tm-tr-muted" aria-live="polite">
          {t("translator.nowSigning", "Signing")}: <strong>{queue.current.label}</strong>
          {queue.upNext.length > 0 && ` · ${t("translator.upNext", "next")}: ${queue.upNext.slice(0, 4).map((i) => i.label).join(" ")}`}
        </p>
      )}
      {queue.failed.length > 0 && (
        <p className="tm-tr-muted" role="status">
          {t("translator.failedClips", "Couldn't play: {{words}}", { words: queue.failed.join(", ") })}
        </p>
      )}
    </div>
  );
}

SignVideoPlayer.propTypes = {
  queue: PropTypes.object.isRequired,
  placeholder: PropTypes.node,
};
