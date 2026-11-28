import React from "react";
import PropTypes from "prop-types";
import { Button, Popover, Segmented, Select, Space, Typography } from "antd";
import { BorderOutlined, CaretRightFilled, PauseOutlined, PoweroffOutlined, SettingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { formatDuration } from "./takes";

/**
 * Under the video: Record / Watch back, one big button for the one thing to do next, and the
 * camera settings tucked away.
 */
export default function RecordBar({
  mode,
  onModeChange,
  engineState,
  isArmed,
  counting,
  time,
  playing,
  camera,
  onRecord,
  onStop,
  onPlayPause,
  canRecord,
}) {
  const { t } = useTranslation();
  const recording = engineState === "recording";
  const cameraOff = camera.status !== "on";

  let main;
  if (mode === "watch") {
    main = (
      <Button size="large" className="tm-bigbtn" type="primary" icon={playing ? <PauseOutlined /> : <CaretRightFilled />} onClick={onPlayPause}>
        {playing ? t("subtitles.bar.pause", "Pause") : t("subtitles.bar.playWithSigning", "Play with my signing")}
      </Button>
    );
  } else if (isArmed || counting) {
    main = (
      <Button size="large" className="tm-bigbtn tm-bigbtn-stop" danger type="primary" icon={<BorderOutlined />} onClick={onStop}>
        {counting ? t("subtitles.bar.cancel", "Cancel") : t("subtitles.recordOff", "Stop recording")}
      </Button>
    );
  } else {
    main = (
      <Button size="large" className="tm-bigbtn tm-bigbtn-rec" danger type="primary" onClick={onRecord} disabled={!canRecord}>
        <span className="tm-rec-dot" aria-hidden />
        {cameraOff
          ? t("subtitles.bar.cameraAndRecord", "Turn on camera and record")
          : t("subtitles.bar.recordFrom", "Record from {{time}}", { time: formatDuration(time) })}
      </Button>
    );
  }

  const hint =
    mode === "watch"
      ? t("subtitles.bar.watchHint", "This is how viewers will see your signing. Switch back to Record to add or redo a part.")
      : recording
        ? t("subtitles.bar.recordingHint", "Sign along with the video. Press Stop (or pause the video) when you need a break.")
        : isArmed
          ? t("subtitles.bar.pausedHint", "Recording is paused. Play the video to continue, or press Stop.")
          : t("subtitles.bar.recordHint", "Find the moment to start (click the timeline), then press Record. A 3-second countdown gives you time to get ready.");

  return (
    <div className="tm-bar">
      <Segmented
        className="tm-bar-mode"
        value={mode}
        onChange={onModeChange}
        disabled={isArmed || counting}
        options={[
          { value: "record", label: t("subtitles.bar.modeRecord", "Record") },
          { value: "watch", label: t("subtitles.bar.modeWatch", "Watch back") },
        ]}
        aria-label={t("subtitles.bar.mode", "Record or watch back")}
      />
      <div className="tm-bar-main">{main}</div>
      <Popover
        trigger="click"
        placement="bottomRight"
        title={t("subtitles.bar.cameraSettings", "Camera")}
        content={
          <Space direction="vertical" className="tm-bar-settings">
            {camera.devices.length > 0 ? (
              <Select
                value={camera.deviceId || camera.devices[0]?.deviceId}
                onChange={camera.selectDevice}
                options={camera.devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))}
                aria-label={t("subtitles.chooseCamera", "Choose a camera")}
                disabled={recording}
                className="tm-sub-device"
              />
            ) : (
              <Typography.Text type="secondary">{t("subtitles.bar.noCameras", "Turn the camera on to choose between cameras.")}</Typography.Text>
            )}
            {camera.status === "on" ? (
              <Button icon={<PoweroffOutlined />} onClick={camera.stop} disabled={isArmed}>
                {t("subtitles.cameraOff", "Turn off camera")}
              </Button>
            ) : (
              <Button type="primary" onClick={() => camera.start()}>
                {t("subtitles.cameraOn", "Turn on camera")}
              </Button>
            )}
          </Space>
        }
      >
        <Button icon={<SettingOutlined />} aria-label={t("subtitles.bar.cameraSettings", "Camera")}>
          <span className="tm-bar-settings-label">{t("subtitles.bar.cameraSettings", "Camera")}</span>
        </Button>
      </Popover>
      <Typography.Text type="secondary" className="tm-bar-hint">
        {hint}
      </Typography.Text>
    </div>
  );
}

RecordBar.propTypes = {
  mode: PropTypes.oneOf(["record", "watch"]).isRequired,
  onModeChange: PropTypes.func.isRequired,
  engineState: PropTypes.string.isRequired,
  isArmed: PropTypes.bool,
  counting: PropTypes.bool,
  time: PropTypes.number,
  playing: PropTypes.bool,
  camera: PropTypes.object.isRequired,
  onRecord: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onPlayPause: PropTypes.func.isRequired,
  canRecord: PropTypes.bool,
};
