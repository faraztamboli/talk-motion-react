import React from "react";
import PropTypes from "prop-types";
import { Alert, Button, Select, Space, Spin, Typography } from "antd";
import { CameraOutlined, PoweroffOutlined, ReloadOutlined, VideoCameraFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const STATE_TEXT = {
  idle: ["off", "Camera is off"],
  ready: ["ready", "Camera on. Turn recording on when you're ready."],
  armed: ["armed", "Recording is on. Play the video to record."],
  recording: ["recording", "Recording your signing…"],
};

/**
 * Step 2 side panel: the signer's camera (mirrored preview, like a mirror; the recording itself
 * is not mirrored), camera choice, and the record switch.
 */
export default function CameraPanel({ camera, engineState, isArmed, canRecord, onArm, onDisarm, pendingUploads }) {
  const { t } = useTranslation();
  const [stateKey, stateText] = STATE_TEXT[engineState] || STATE_TEXT.idle;

  return (
    <div className="tm-sub-camera">
      <div className="tm-sub-camera-stage">
        <video ref={camera.videoRef} className="tm-sub-camera-video" muted playsInline aria-label={t("subtitles.preview", "Camera preview")} />
        {camera.status !== "on" && (
          <div className="tm-sub-camera-msg">
            {camera.status === "opening" && (
              <>
                <Spin />
                <span>{t("subtitles.cameraOpening", "Opening the camera… allow access if your browser asks.")}</span>
              </>
            )}
            {camera.status === "off" && (
              <>
                <CameraOutlined className="tm-sub-camera-icon" aria-hidden />
                <span>{t("subtitles.cameraOffHelp", "Your camera records your signing. It stays off until you turn it on.")}</span>
                <Button type="primary" icon={<CameraOutlined />} onClick={() => camera.start()}>
                  {t("subtitles.cameraOn", "Turn on camera")}
                </Button>
              </>
            )}
            {camera.status === "error" && (
              <div role="alert" className="tm-sub-center">
                <span>{camera.error?.message}</span>
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => camera.start()}>
                  {t("subtitles.tryAgain", "Try again")}
                </Button>
              </div>
            )}
          </div>
        )}
        {engineState === "recording" && (
          <span className="tm-sub-rec-dot" role="status">
            REC
          </span>
        )}
      </div>

      <Space wrap className="tm-sub-camera-tools">
        {camera.devices.length > 1 && (
          <Select
            size="small"
            value={camera.deviceId || camera.devices[0]?.deviceId}
            onChange={camera.selectDevice}
            options={camera.devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))}
            className="tm-sub-device"
            aria-label={t("subtitles.chooseCamera", "Choose a camera")}
            disabled={engineState === "recording"}
          />
        )}
        {camera.status === "on" && (
          <Button size="small" icon={<PoweroffOutlined />} onClick={camera.stop} disabled={isArmed}>
            {t("subtitles.cameraOff", "Turn off camera")}
          </Button>
        )}
      </Space>

      <div className={`tm-sub-status tm-sub-status-${stateKey}`} role="status" aria-live="polite">
        {t(`subtitles.state.${stateKey}`, stateText)}
      </div>

      <Button
        type={isArmed ? "default" : "primary"}
        danger={isArmed}
        size="large"
        block
        icon={<VideoCameraFilled />}
        disabled={!canRecord && !isArmed}
        aria-pressed={isArmed}
        onClick={isArmed ? onDisarm : onArm}
      >
        {isArmed ? t("subtitles.recordOff", "Stop recording") : t("subtitles.recordOn", "Turn recording on")}
      </Button>
      <Typography.Text type="secondary" className="tm-sub-help">
        {isArmed
          ? t("subtitles.recordingHelp", "Play the video to record; pause to end a segment. Re-record a part by seeking back and playing again.")
          : t("subtitles.armHelp", "With recording on, each time the video plays your signing is recorded in sync.")}
      </Typography.Text>
      {pendingUploads > 0 && (
        <Alert
          className="tm-sub-gap"
          type="info"
          showIcon
          message={t("subtitles.uploading", "Uploading {{count}} segment(s). Keep this page open until they're saved.", { count: pendingUploads })}
        />
      )}
    </div>
  );
}

CameraPanel.propTypes = {
  camera: PropTypes.object.isRequired,
  engineState: PropTypes.string.isRequired,
  isArmed: PropTypes.bool,
  canRecord: PropTypes.bool,
  onArm: PropTypes.func.isRequired,
  onDisarm: PropTypes.func.isRequired,
  pendingUploads: PropTypes.number,
};
