import React from "react";
import PropTypes from "prop-types";
import { Button, Select, Spin } from "antd";
import { CameraOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import "./landmarks.css";

/**
 * The camera box for a useLandmarker() instance: mirrored video with the landmark overlay, and
 * a clear message for every state (off, opening, loading, no hands, errors with a way out).
 */
export default function LandmarkerView({
  lm,
  idleTitle = "Camera is off",
  idleHint = "Turn the camera on when you're ready.",
  startLabel = "Turn on camera",
  showStartButton = true,
  showHandHint = true,
  showDevicePicker = true,
  overlay = null,
  className = "",
  ariaLabel = "Camera",
}) {
  const { status, error, handsVisible, devices, deviceId, selectDevice, start } = lm;
  const running = status === "running";

  let message = null;
  if (status === "idle") {
    message = (
      <div className="tm-cam-msg">
        <CameraOutlined className="tm-cam-msg-icon" aria-hidden />
        <strong>{idleTitle}</strong>
        <span>{idleHint}</span>
        {showStartButton && (
          <Button type="primary" icon={<CameraOutlined />} onClick={() => start()}>
            {startLabel}
          </Button>
        )}
      </div>
    );
  } else if (status === "camera") {
    message = (
      <div className="tm-cam-msg">
        <Spin />
        <strong>Opening the camera…</strong>
        <span>If your browser asks, allow camera access.</span>
      </div>
    );
  } else if (status === "engine") {
    message = (
      <div className="tm-cam-msg tm-cam-msg-overlay">
        <Spin />
        <strong>Loading sign recognition…</strong>
        <span>The first time takes a few seconds.</span>
      </div>
    );
  } else if (status === "error" && error) {
    message = (
      <div className="tm-cam-msg" role="alert">
        <WarningOutlined className="tm-cam-msg-icon tm-cam-msg-icon-warn" aria-hidden />
        <strong>{error.code === "engine-failed" ? "Recognition didn't start" : "Camera unavailable"}</strong>
        <span>{error.message}</span>
        <Button type="primary" icon={<ReloadOutlined />} onClick={() => start()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={`tm-cam ${className}`} role="region" aria-label={ariaLabel}>
      <div className="tm-cam-stage">
        {/* The canvas draws the mirrored frame; the video only feeds it. */}
        <video ref={lm.videoRef} className="tm-cam-video" muted playsInline aria-hidden />
        <canvas ref={lm.canvasRef} className={`tm-cam-canvas ${running || status === "engine" ? "" : "tm-cam-hidden"}`} />
        {message}
        {running && showHandHint && !handsVisible && (
          <div className="tm-cam-hint" role="status">
            Show your hands to the camera
          </div>
        )}
        {running && overlay}
      </div>
      {showDevicePicker && devices.length > 1 && (
        <div className="tm-cam-toolbar">
          <label className="tm-cam-device">
            <span>Camera</span>
            <Select
              size="small"
              value={deviceId || devices[0]?.deviceId}
              onChange={selectDevice}
              options={devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))}
              style={{ minWidth: 180 }}
              aria-label="Choose a camera"
            />
          </label>
        </div>
      )}
      <span className="tm-visually-hidden" aria-live="polite">
        {status === "running" ? (handsVisible ? "Hands visible" : "No hands visible") : ""}
      </span>
    </div>
  );
}

LandmarkerView.propTypes = {
  lm: PropTypes.object.isRequired,
  idleTitle: PropTypes.node,
  idleHint: PropTypes.node,
  startLabel: PropTypes.node,
  showStartButton: PropTypes.bool,
  showHandHint: PropTypes.bool,
  showDevicePicker: PropTypes.bool,
  overlay: PropTypes.node,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};
