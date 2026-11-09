import React, { Suspense, lazy, useRef } from "react";
import PropTypes from "prop-types";
import { Button, Spin, Tooltip } from "antd";
import { MdFullscreen, MdFullscreenExit, MdReplay, MdStop } from "react-icons/md";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useFullscreen } from "./SignVideoPlayer";

// three.js lives in this chunk; it loads only when someone picks the avatar.
const AvatarStage = lazy(() => import("./AvatarStage"));

/** The signing avatar (useAvatarQueue) with stop, replay and full screen. */
export default function AvatarPlayer({ avatar, onReplay, canReplay, placeholder }) {
  const { t } = useTranslation();
  const stageRef = useRef(null);
  const fs = useFullscreen(stageRef);
  return (
    <div className="tm-tr-player">
      <div ref={stageRef} className={`tm-tr-stage tm-tr-stage-avatar ${fs.active ? "tm-tr-stage-full" : ""}`}>
        <ErrorBoundary compact title={t("translator.avatarFailed", "The avatar couldn't be shown in this browser.")}>
          <Suspense
            fallback={
              <div className="tm-tr-stage-placeholder">
                <Spin /> {t("translator.avatarLoading", "Loading the avatar…")}
              </div>
            }
          >
            <AvatarStage frame={avatar.frame} />
          </Suspense>
        </ErrorBoundary>
        {!avatar.playing && !avatar.frame && <div className="tm-tr-stage-placeholder tm-tr-stage-placeholder-soft">{placeholder}</div>}
        {avatar.label && (
          <div className="tm-tr-stage-caption" aria-hidden>
            {avatar.label}
          </div>
        )}
      </div>
      <div className="tm-tr-player-bar">
        <Tooltip title={t("translator.stopSigns", "Stop signing")}>
          <Button size="small" onClick={avatar.stop} disabled={!avatar.playing} icon={<MdStop aria-hidden />} aria-label={t("translator.stopSigns", "Stop signing")} />
        </Tooltip>
        <Tooltip title={t("translator.replay", "Replay the last sentence")}>
          <Button size="small" onClick={onReplay} disabled={!canReplay} icon={<MdReplay aria-hidden />} aria-label={t("translator.replay", "Replay the last sentence")} />
        </Tooltip>
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
      {avatar.label && (
        <p className="tm-tr-muted" aria-live="polite">
          {t("translator.nowSigning", "Signing")}: <strong>{avatar.label}</strong>
        </p>
      )}
    </div>
  );
}

AvatarPlayer.propTypes = {
  avatar: PropTypes.object.isRequired,
  onReplay: PropTypes.func,
  canReplay: PropTypes.bool,
  placeholder: PropTypes.node,
};
