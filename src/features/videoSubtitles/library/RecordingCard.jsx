import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlayCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/** One recording in a library grid. Owner actions only on the owner's own recordings. */
export default function RecordingCard({ recording, ownerActions, onTogglePrivacy, onDelete, busy }) {
  const { t } = useTranslation();
  const [thumbFailed, setThumbFailed] = useState(false);
  const href = `/video-subtitles/library/${recording.id}`;

  const cover = (
    <Link to={href} className="tm-lib-thumb" aria-label={t("subtitles.library.watch", "Watch {{title}}", { title: recording.title })}>
      {recording.thumbnailUrl && !thumbFailed ? (
        <img src={recording.thumbnailUrl} alt="" loading="lazy" onError={() => setThumbFailed(true)} />
      ) : (
        <span className="tm-lib-thumb-fallback" aria-hidden>
          <PlayCircleOutlined />
        </span>
      )}
      {recording.duration ? <span className="tm-lib-duration">{Math.floor(recording.duration / 60)}:{String(Math.floor(recording.duration % 60)).padStart(2, "0")}</span> : null}
    </Link>
  );

  const actions = ownerActions
    ? [
        <Tooltip key="edit" title={t("subtitles.library.edit", "Edit")}>
          <Link to={`/video-subtitles/designer/${recording.id}`} aria-label={t("subtitles.library.edit", "Edit")}>
            <EditOutlined />
          </Link>
        </Tooltip>,
        <Popconfirm
          key="privacy"
          title={recording.isPublic ? t("subtitles.publish.makePrivateQ", "Make this recording private?") : t("subtitles.publish.makePublicQ", "Make this recording public?")}
          onConfirm={() => onTogglePrivacy(recording, !recording.isPublic)}
          okText={t("subtitles.publish.confirm", "Yes")}
        >
          <Switch
            size="small"
            checked={recording.isPublic}
            loading={busy === "privacy"}
            checkedChildren={t("subtitles.public", "Public")}
            unCheckedChildren={t("subtitles.private", "Private")}
            aria-label={t("subtitles.publish.visibility", "Who can watch")}
          />
        </Popconfirm>,
        <Popconfirm
          key="delete"
          title={t("subtitles.library.deleteQ", "Delete this recording?")}
          description={t("subtitles.library.deleteHelp", "Its signing and captions are deleted. This can't be undone.")}
          okText={t("subtitles.delete", "Delete")}
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(recording)}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} loading={busy === "delete"} aria-label={t("subtitles.library.delete", "Delete recording")} />
        </Popconfirm>,
      ]
    : undefined;

  return (
    <Card className="tm-lib-card" cover={cover} actions={actions} hoverable>
      <Link to={href} className="tm-lib-title">
        <Typography.Text strong ellipsis={{ tooltip: recording.title }}>
          {recording.title}
        </Typography.Text>
      </Link>
      {!ownerActions && (
        <Space size={6} className="tm-lib-creator">
          <Avatar size={20} src={recording.creator?.img || undefined} icon={<UserOutlined />} />
          <Typography.Text type="secondary" ellipsis>
            {recording.creator?.fullname || recording.creator?.username || recording.owner}
          </Typography.Text>
        </Space>
      )}
      <Space size={4} wrap className="tm-lib-tags">
        {ownerActions && <Tag color={recording.isPublic ? "green" : "default"}>{recording.isPublic ? t("subtitles.public", "Public") : t("subtitles.private", "Private")}</Tag>}
        {recording.shotCount != null && <Tag>{t("subtitles.library.segments", "{{count}} segments", { count: recording.shotCount })}</Tag>}
        {recording.captionCount ? <Tag color="blue">CC</Tag> : null}
      </Space>
    </Card>
  );
}

RecordingCard.propTypes = {
  recording: PropTypes.object.isRequired,
  ownerActions: PropTypes.bool,
  onTogglePrivacy: PropTypes.func,
  onDelete: PropTypes.func,
  busy: PropTypes.string,
};
