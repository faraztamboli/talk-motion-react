import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Spin, Tooltip } from "antd";
import { BorderOuterOutlined, CameraOutlined, ColumnWidthOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const PIP_KEY = "tm_studio_pip";
const CORNERS = ["br", "bl", "tl", "tr"];
const SIZES = ["m", "l", "s"];

function loadPip() {
  try {
    const saved = JSON.parse(localStorage.getItem(PIP_KEY) || "{}");
    return { corner: CORNERS.includes(saved.corner) ? saved.corner : "br", size: SIZES.includes(saved.size) ? saved.size : "m" };
  } catch {
    return { corner: "br", size: "m" };
  }
}

/**
 * The YouTube video with the signer picture-in-picture, as viewers will see it:
 *  - overlay "camera": your live camera (mirrored, like a mirror) while you record
 *  - overlay "takes":  your recorded takes, in step with the video ("Watch back")
 *  - overlay "none":   just the video (choosing a video)
 * Plus the 3-2-1 countdown and the recording badge.
 */
export default function StagePlayer({
  containerRef,
  playerError,
  playerLoading,
  overlay,
  camera,
  takeVideoRef,
  takeShowing,
  countdown,
  onCancelCountdown,
  badge,
}) {
  const { t } = useTranslation();
  const [pip, setPip] = useState(loadPip);

  useEffect(() => {
    try {
      localStorage.setItem(PIP_KEY, JSON.stringify(pip));
    } catch {
      // per-browser convenience only
    }
  }, [pip]);

  const pipVisible = overlay === "camera" || (overlay === "takes" && takeShowing);

  return (
    <div className="tm-stage">
      <div className="tm-stage-video tm-sub-player-wrap">
        <div className="tm-sub-player" ref={containerRef} />
        {playerLoading && !playerError && (
          <div className="tm-stage-loading" role="status">
            <Spin />
            <span>{t("subtitles.loadingPlayer", "Loading the video…")}</span>
          </div>
        )}
        {playerError && (
          <div className="tm-sub-player-error" role="alert">
            <strong>{t("subtitles.playerError", "The video can't play")}</strong>
            <span>{playerError}</span>
          </div>
        )}

        <div
          className={`tm-pip is-${pip.corner} is-${pip.size} ${pipVisible ? "" : "is-hidden"} ${overlay === "camera" ? "is-camera" : "is-take"}`}
          role="group"
          aria-label={overlay === "camera" ? t("subtitles.pip.camera", "Your camera") : t("subtitles.pip.take", "Your recorded signing")}
        >
          {/* Always mounted: the camera hook attaches its stream to this element. */}
          <video ref={camera.videoRef} className="tm-sub-camera-video tm-pip-camera" muted playsInline hidden={overlay !== "camera"} />
          <video ref={takeVideoRef} className="tm-pip-take" muted playsInline preload="auto" hidden={overlay !== "takes"} />

          {overlay === "camera" && camera.status !== "on" && (
            <div className="tm-pip-msg">
              {camera.status === "opening" && (
                <>
                  <Spin size="small" />
                  <span>{t("subtitles.cameraOpening", "Opening the camera… allow access if your browser asks.")}</span>
                </>
              )}
              {camera.status === "off" && (
                <>
                  <CameraOutlined className="tm-pip-icon" aria-hidden />
                  <Button type="primary" size="small" icon={<CameraOutlined />} onClick={() => camera.start()}>
                    {t("subtitles.cameraOn", "Turn on camera")}
                  </Button>
                </>
              )}
              {camera.status === "error" && (
                <>
                  <span>{camera.error?.message}</span>
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => camera.start()}>
                    {t("subtitles.tryAgain", "Try again")}
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="tm-pip-tools">
            <Tooltip title={t("subtitles.pip.move", "Move to the next corner")}>
              <Button
                size="small"
                type="text"
                icon={<BorderOuterOutlined />}
                aria-label={t("subtitles.pip.move", "Move to the next corner")}
                onClick={() => setPip((p) => ({ ...p, corner: CORNERS[(CORNERS.indexOf(p.corner) + 1) % CORNERS.length] }))}
              />
            </Tooltip>
            <Tooltip title={t("subtitles.pip.size", "Change the size")}>
              <Button
                size="small"
                type="text"
                icon={<ColumnWidthOutlined />}
                aria-label={t("subtitles.pip.size", "Change the size")}
                onClick={() => setPip((p) => ({ ...p, size: SIZES[(SIZES.indexOf(p.size) + 1) % SIZES.length] }))}
              />
            </Tooltip>
          </div>
        </div>

        {badge && (
          <div className={`tm-stage-badge is-${badge.tone}`} role="status" aria-live="polite">
            {badge.tone === "rec" && <span className="tm-rec-dot" aria-hidden />}
            {badge.text}
          </div>
        )}

        {countdown != null && (
          <div className="tm-countdown" role="status" aria-live="assertive">
            <span className="tm-countdown-label">{t("subtitles.countdown.ready", "Get ready to sign")}</span>
            <span className="tm-countdown-n" key={countdown}>
              {countdown}
            </span>
            <Button ghost onClick={onCancelCountdown}>
              {t("subtitles.countdown.cancel", "Cancel")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

StagePlayer.propTypes = {
  containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  playerError: PropTypes.string,
  playerLoading: PropTypes.bool,
  overlay: PropTypes.oneOf(["camera", "takes", "none"]).isRequired,
  camera: PropTypes.object.isRequired,
  takeVideoRef: PropTypes.object.isRequired,
  takeShowing: PropTypes.bool,
  countdown: PropTypes.number,
  onCancelCountdown: PropTypes.func,
  badge: PropTypes.shape({ tone: PropTypes.string, text: PropTypes.node }),
};
