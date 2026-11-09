import React from "react";
import PropTypes from "prop-types";
import { Button, Empty, List, Progress, Space, Tag, Tooltip, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

const STATUS_TAG = {
  recording: { color: "red", label: "Recording" },
  uploading: { color: "processing", label: "Uploading" },
  saved: { color: "success", label: "Saved" },
  failed: { color: "error", label: "Failed" },
  discarded: { color: "default", label: "Discarded" },
};

function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "–:––";
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Visual list of recorded segments with a coverage bar over the video
 * duration, per-shot upload progress, and a retry action for failures.
 */
function ShotTimeline({ shots, videoDuration, onRetry }) {
  if (!shots.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No segments recorded yet. Play the video with recording enabled to create your first segment."
      />
    );
  }

  return (
    <div>
      {/* Coverage bar: which parts of the video have sign-language segments */}
      {videoDuration > 0 && (
        <div
          aria-label="Video coverage"
          style={{
            position: "relative",
            height: 14,
            borderRadius: 7,
            background: "#f0f0f0",
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {shots
            .filter((s) => s.original_video_end != null && s.status !== "discarded")
            .map((s) => (
              <Tooltip
                key={s.localId}
                title={`${formatTime(s.original_video_start)} – ${formatTime(s.original_video_end)}`}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${(s.original_video_start / videoDuration) * 100}%`,
                    width: `${Math.max(0.5, ((s.original_video_end - s.original_video_start) / videoDuration) * 100)}%`,
                    top: 0,
                    bottom: 0,
                    background: s.status === "saved" ? "#52c41a" : s.status === "failed" ? "#ff4d4f" : "#1677ff",
                  }}
                />
              </Tooltip>
            ))}
        </div>
      )}

      <List
        size="small"
        dataSource={shots}
        rowKey={(s) => s.localId}
        renderItem={(shot, index) => {
          const tag = STATUS_TAG[shot.status] ?? STATUS_TAG.discarded;
          return (
            <List.Item
              actions={
                shot.status === "failed"
                  ? [
                      <Button
                        key="retry"
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => onRetry(shot.localId)}
                      >
                        Retry upload
                      </Button>,
                    ]
                  : undefined
              }
            >
              <Space direction="vertical" size={2} style={{ width: "100%" }}>
                <Space>
                  <Text strong>Segment {index + 1}</Text>
                  <Text type="secondary">
                    {formatTime(shot.original_video_start)} – {formatTime(shot.original_video_end)}
                  </Text>
                  <Tag color={tag.color}>{tag.label}</Tag>
                </Space>
                {shot.status === "uploading" && (
                  <Progress percent={Math.round(shot.uploadProgress * 100)} size="small" />
                )}
                {shot.error && shot.status !== "saved" && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {shot.error}
                  </Text>
                )}
              </Space>
            </List.Item>
          );
        }}
      />
    </div>
  );
}

ShotTimeline.propTypes = {
  shots: PropTypes.arrayOf(PropTypes.object).isRequired,
  videoDuration: PropTypes.number,
  onRetry: PropTypes.func.isRequired,
};

export default ShotTimeline;
