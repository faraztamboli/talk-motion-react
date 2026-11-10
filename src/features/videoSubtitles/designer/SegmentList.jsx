import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Empty, Modal, Popconfirm, Progress, Space, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EyeOutlined, ReloadOutlined, StepForwardOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { formatClock } from "../captions/cueFormats";

const STATUS = {
  recording: { color: "red", text: "Recording" },
  stopping: { color: "orange", text: "Finishing" },
  queued: { color: "default", text: "Waiting to upload" },
  uploading: { color: "processing", text: "Uploading" },
  saved: { color: "success", text: "Saved" },
  complete: { color: "success", text: "Saved" },
  failed: { color: "error", text: "Upload failed" },
  discarded: { color: "default", text: "Too short, not kept" },
  initialized: { color: "warning", text: "Never uploaded" },
};

/**
 * Every segment of the recording: the ones already on the server (edit mode) and the ones
 * recorded now, with status, a preview, a jump to that point of the video, retry and delete.
 */
export default function SegmentList({ segments, serverShots, duration, onSeek, onRetry, onRemove, onRemoveServerShot }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(null);

  const rows = useMemo(() => {
    const localShotIds = new Set(segments.map((s) => s.shotId).filter(Boolean));
    const server = (serverShots || [])
      .filter((s) => !localShotIds.has(s.id))
      .map((s) => ({
        key: `server-${s.id}`,
        source: "server",
        shotId: s.id,
        start: s.startTime,
        end: s.endTime,
        status: s.status,
        videoUrl: s.videoUrl,
        error: s.error,
      }));
    const local = segments.map((s) => ({
      key: `local-${s.localId}`,
      source: "local",
      localId: s.localId,
      shotId: s.shotId,
      start: s.start,
      end: s.end,
      status: s.status,
      progress: s.progress,
      videoUrl: s.videoUrl,
      previewUrl: s.previewUrl,
      error: s.error,
      restored: s.restored,
    }));
    return [...server, ...local].sort((a, b) => a.start - b.start);
  }, [segments, serverShots]);

  if (!rows.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("subtitles.noSegments", "No segments yet. Turn recording on and play the video.")} />;
  }

  const total = duration > 0 ? duration : Math.max(...rows.map((r) => r.end || r.start || 0), 1);

  return (
    <>
      <div className="tm-sub-timeline" aria-hidden>
        {rows
          .filter((r) => r.end > r.start)
          .map((r) => (
            <span
              key={r.key}
              className={`tm-sub-timeline-bar is-${r.status}`}
              style={{ left: `${(r.start / total) * 100}%`, width: `${Math.max(0.5, ((r.end - r.start) / total) * 100)}%` }}
            />
          ))}
      </div>
      <ul className="tm-sub-segments">
        {rows.map((r, index) => {
          const status = STATUS[r.status] || { color: "default", text: r.status };
          const src = r.previewUrl || r.videoUrl;
          const busy = r.status === "recording" || r.status === "stopping" || r.status === "uploading";
          return (
            <li key={r.key} className="tm-sub-segment">
              <div className="tm-sub-segment-main">
                <strong>
                  {t("subtitles.segmentN", "Segment {{n}}", { n: index + 1 })}{" "}
                  <span className="tm-sub-segment-time">
                    {formatClock((r.start || 0) * 1000)}
                    {r.end != null ? ` – ${formatClock(r.end * 1000)}` : ""}
                  </span>
                </strong>
                <Space size={4} wrap>
                  <Tag color={status.color}>{t(`subtitles.segmentStatus.${r.status}`, status.text)}</Tag>
                  {r.restored && <Tag>{t("subtitles.restored", "Recovered after reload")}</Tag>}
                </Space>
                {r.status === "uploading" && <Progress percent={Math.round((r.progress || 0) * 100)} size="small" />}
                {r.error && r.status !== "discarded" && (
                  <Typography.Text type="danger" className="tm-sub-help">
                    {r.error}
                  </Typography.Text>
                )}
              </div>
              <Space size={2}>
                <Tooltip title={t("subtitles.jumpTo", "Play the video from here")}>
                  <Button type="text" icon={<StepForwardOutlined />} onClick={() => onSeek(r.start)} aria-label={t("subtitles.jumpTo", "Play the video from here")} />
                </Tooltip>
                <Tooltip title={t("subtitles.watchSegment", "Watch this segment")}>
                  <Button type="text" icon={<EyeOutlined />} disabled={!src} onClick={() => setPreview({ src, index })} aria-label={t("subtitles.watchSegment", "Watch this segment")} />
                </Tooltip>
                {r.status === "failed" && r.source === "local" && (
                  <Tooltip title={t("subtitles.retry", "Upload again")}>
                    <Button type="text" icon={<ReloadOutlined />} onClick={() => onRetry(r.localId)} aria-label={t("subtitles.retry", "Upload again")} />
                  </Tooltip>
                )}
                <Popconfirm
                  title={t("subtitles.deleteSegmentQ", "Delete this segment?")}
                  description={t("subtitles.deleteSegmentHelp", "Its signing is removed from the recording.")}
                  okText={t("subtitles.delete", "Delete")}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => (r.source === "server" ? onRemoveServerShot(r.shotId) : onRemove(r.localId))}
                  disabled={busy}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} disabled={busy} aria-label={t("subtitles.deleteSegment", "Delete segment")} />
                </Popconfirm>
              </Space>
            </li>
          );
        })}
      </ul>
      <Modal
        open={Boolean(preview)}
        onCancel={() => setPreview(null)}
        footer={null}
        title={preview ? t("subtitles.segmentN", "Segment {{n}}", { n: preview.index + 1 }) : ""}
        destroyOnClose
      >
        {preview && <video className="tm-sub-preview-video" src={preview.src} controls autoPlay muted playsInline />}
      </Modal>
    </>
  );
}

SegmentList.propTypes = {
  segments: PropTypes.array.isRequired,
  serverShots: PropTypes.array,
  duration: PropTypes.number,
  onSeek: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onRemoveServerShot: PropTypes.func.isRequired,
};
