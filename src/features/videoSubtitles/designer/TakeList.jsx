import React from "react";
import PropTypes from "prop-types";
import { Button, Popconfirm, Progress, Tooltip } from "antd";
import {
  CheckCircleFilled,
  DeleteOutlined,
  ExclamationCircleFilled,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { formatDuration, statusOf } from "./takes";

const BUSY = new Set(["recording", "stopping", "uploading"]);

function StatusLine({ row, t }) {
  const { tone, label } = statusOf(row.status);
  const text = t(`subtitles.takeStatus.${row.status}`, label);
  if (row.status === "uploading") {
    return (
      <div className="tm-take-status is-busy" role="status">
        <LoadingOutlined aria-hidden /> {text} {Math.round((row.progress || 0) * 100)}%
        <Progress percent={Math.round((row.progress || 0) * 100)} showInfo={false} size="small" className="tm-take-progress" />
      </div>
    );
  }
  const icon =
    tone === "ok" ? <CheckCircleFilled aria-hidden /> : tone === "error" ? <ExclamationCircleFilled aria-hidden /> : tone === "busy" ? <LoadingOutlined aria-hidden /> : null;
  return (
    <div className={`tm-take-status is-${tone}`} role="status">
      {icon} {text}
      {row.status === "processing" && <span className="tm-take-hint"> · {t("subtitles.take.processingHint", "you can keep working")}</span>}
    </div>
  );
}

StatusLine.propTypes = { row: PropTypes.object.isRequired, t: PropTypes.func.isRequired };

/**
 * Every take of this recording, in video order, each with what it covers, where it stands
 * (saving, preparing, saved, couldn't save), and Watch / Record again / Delete.
 */
export default function TakeList({ rows, selectedKey, onSelect, onWatch, onRerecord, onRetry, onRemove, recording }) {
  const { t } = useTranslation();
  const kept = rows.filter((r) => r.status !== "discarded" || r.source === "local");

  if (!kept.length) {
    return (
      <div className="tm-takes-empty">
        <strong>{t("subtitles.takes.emptyTitle", "No signing yet")}</strong>
        <p>{t("subtitles.takes.emptyBody", "Press Record. The video plays and your camera records you signing along. Each time you stop, that part is saved as a take.")}</p>
      </div>
    );
  }

  return (
    <ol className="tm-takes" aria-label={t("subtitles.takes.label", "Your takes")}>
      {kept.map((row) => {
        const busy = BUSY.has(row.status);
        const watchable = Boolean(row.previewUrl || row.videoUrl) && row.end > row.start;
        const canRetry = row.status === "failed" && row.source === "local";
        return (
          <li
            key={row.key}
            className={`tm-take ${selectedKey === row.key ? "is-selected" : ""} is-${statusOf(row.status).tone}`}
            onClick={() => onSelect?.(row)}
          >
            <div className="tm-take-main">
              <div className="tm-take-title">
                <strong>{t("subtitles.takeN", "Take {{n}}", { n: row.number })}</strong>
                <span className="tm-take-time">
                  {formatDuration(row.start)} – {formatDuration(row.end)}
                  <span className="tm-take-length"> · {formatDuration(Math.max(0, row.end - row.start))}</span>
                </span>
              </div>
              <StatusLine row={row} t={t} />
              {row.restored && row.status !== "saved" && (
                <span className="tm-take-hint">{t("subtitles.take.restored", "From your last visit")}</span>
              )}
              {row.error && row.status !== "discarded" && <span className="tm-take-error">{row.error}</span>}
              {(row.status === "interrupted" || row.status === "initialized") && (
                <span className="tm-take-hint">{t("subtitles.take.interrupted", "This take's upload was interrupted. Delete it and record that part again.")}</span>
              )}
            </div>
            <div className="tm-take-actions" onClick={(e) => e.stopPropagation()}>
              {canRetry && (
                <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => onRetry(row.localId)}>
                  {t("subtitles.take.retry", "Try again")}
                </Button>
              )}
              <Tooltip title={t("subtitles.take.watchHelp", "Watch the video with this take")}>
                <Button size="small" icon={<PlayCircleOutlined />} disabled={!watchable || recording} onClick={() => onWatch(row)}>
                  {t("subtitles.take.watch", "Watch")}
                </Button>
              </Tooltip>
              <Tooltip title={t("subtitles.take.rerecordHelp", "Go to the start of this take to record it again. The new take replaces it where they overlap.")}>
                <Button size="small" icon={<RedoOutlined />} disabled={recording} onClick={() => onRerecord(row)}>
                  {t("subtitles.take.rerecord", "Redo")}
                </Button>
              </Tooltip>
              <Popconfirm
                title={t("subtitles.take.deleteQ", "Delete take {{n}}?", { n: row.number })}
                description={t("subtitles.take.deleteHelp", "Its signing is removed from the recording.")}
                okText={t("subtitles.delete", "Delete")}
                okButtonProps={{ danger: true }}
                onConfirm={() => onRemove(row)}
                disabled={busy}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={busy} aria-label={t("subtitles.take.delete", "Delete take {{n}}", { n: row.number })} />
              </Popconfirm>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

TakeList.propTypes = {
  rows: PropTypes.array.isRequired,
  selectedKey: PropTypes.string,
  onSelect: PropTypes.func,
  onWatch: PropTypes.func.isRequired,
  onRerecord: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  recording: PropTypes.bool,
};
