import React from "react";
import PropTypes from "prop-types";
import { Space, Typography } from "antd";
import {
  CameraOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  PauseCircleFilled,
  VideoCameraFilled,
  VideoCameraOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

/**
 * Large always-visible recording state banner. Everything is conveyed
 * visually (color + icon + text) — never sound — for Deaf and non-speaking
 * users, and announced via a polite live region for assistive tech.
 */
const STATES = {
  idle: {
    color: "#8c8c8c",
    background: "#fafafa",
    icon: <CameraOutlined />,
    label: "Camera off",
    hint: "Select a video to turn on your camera",
  },
  cameraReady: {
    color: "#1677ff",
    background: "#e6f4ff",
    icon: <VideoCameraOutlined />,
    label: "Camera ready",
    hint: "Press the record button to enable recording",
  },
  armed: {
    color: "#fa8c16",
    background: "#fff7e6",
    icon: <PauseCircleFilled />,
    label: "Ready to record",
    hint: "Recording will start when the video plays",
  },
  recording: {
    color: "#cf1322",
    background: "#fff1f0",
    icon: <VideoCameraFilled />,
    label: "Recording",
    hint: "Pause the video to finish this segment",
  },
  uploading: {
    color: "#1677ff",
    background: "#e6f4ff",
    icon: <LoadingOutlined />,
    label: "Uploading",
    hint: "Your segments are being saved",
  },
  saved: {
    color: "#389e0d",
    background: "#f6ffed",
    icon: <CheckCircleFilled />,
    label: "All segments saved",
    hint: "You can keep recording or finish",
  },
  error: {
    color: "#cf1322",
    background: "#fff1f0",
    icon: <CloseCircleFilled />,
    label: "Something went wrong",
    hint: "See the details below",
  },
};

function RecordingStatusIndicator({ state, errorMessage }) {
  const config = STATES[state] ?? STATES.idle;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 24px",
        borderRadius: 8,
        border: `2px solid ${config.color}`,
        background: config.background,
      }}
    >
      <span style={{ fontSize: 32, color: config.color }} aria-hidden="true">
        {config.icon}
      </span>
      <Space direction="vertical" size={0}>
        <Text strong style={{ fontSize: 18, color: config.color }}>
          {config.label}
        </Text>
        <Text type="secondary">{state === "error" && errorMessage ? errorMessage : config.hint}</Text>
      </Space>
    </div>
  );
}

RecordingStatusIndicator.propTypes = {
  state: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
};

export default RecordingStatusIndicator;
