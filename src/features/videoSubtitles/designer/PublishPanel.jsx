import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Alert, Button, Input, Popconfirm, Space, Switch, Typography, message } from "antd";
import { EyeOutlined, SaveOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSetRecordingDetailsMutation, useSetRecordingPrivacyMutation } from "../recordingsApi";
import { rpcErrorMessage } from "../../../api/rpc";

/**
 * Step 3: the recording's own title and description, who can see it, and a link to watch it.
 * YouTube's title never overwrites what the author typed.
 */
export default function PublishPanel({ recording, details, segmentCount, captionCount, pendingUploads, onDirtyChange }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const savedTitle = details?.recording?.ownTitle || details?.recording?.title || "";
  const savedDescription = details?.recording?.description || "";
  const [title, setTitle] = useState(savedTitle);
  const [description, setDescription] = useState(savedDescription);
  const [setDetails, detailsState] = useSetRecordingDetailsMutation();
  const [setPrivacy, privacyState] = useSetRecordingPrivacyMutation();
  const isPublic = Boolean(details?.recording?.isPublic);

  useEffect(() => {
    setTitle(savedTitle);
    setDescription(savedDescription);
  }, [savedTitle, savedDescription]);

  const dirty = title !== savedTitle || description !== savedDescription;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  const save = async () => {
    if (!title.trim()) {
      messageApi.error(t("subtitles.publish.titleNeeded", "Give your recording a title."));
      return;
    }
    const res = await setDetails({ id: recording.id, title: title.trim(), description });
    if (res.error) messageApi.error(rpcErrorMessage(res.error, t("subtitles.publish.saveFailed", "The details couldn't be saved.")));
    else messageApi.success(t("subtitles.publish.saved", "Details saved."));
  };

  const togglePrivacy = async (next) => {
    const res = await setPrivacy({ id: recording.id, isPublic: next });
    if (res.error) messageApi.error(rpcErrorMessage(res.error, t("subtitles.publish.privacyFailed", "Who can see the recording couldn't be changed.")));
    else messageApi.success(next ? t("subtitles.publish.nowPublic", "Anyone signed in can now find and watch it.") : t("subtitles.publish.nowPrivate", "Only you (and people you share it with) can watch it now."));
  };

  return (
    <div className="tm-sub-publish">
      {contextHolder}
      <div className="tm-sub-summary">
        <div>
          <strong>{segmentCount}</strong>
          <span>{t("subtitles.publish.segments", "sign segments")}</span>
        </div>
        <div>
          <strong>{captionCount}</strong>
          <span>{t("subtitles.publish.captions", "captions")}</span>
        </div>
      </div>
      {pendingUploads > 0 && (
        <Alert type="warning" showIcon message={t("subtitles.publish.pending", "{{count}} segment(s) are still uploading. Keep this page open until they're saved.", { count: pendingUploads })} />
      )}
      <label htmlFor="tm-pub-title" className="tm-sub-label">
        {t("subtitles.titleLabel", "Title of your recording")}
      </label>
      <Input id="tm-pub-title" value={title} maxLength={250} showCount onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="tm-pub-description" className="tm-sub-label">
        {t("subtitles.publish.description", "Description")}
      </label>
      <Input.TextArea id="tm-pub-description" value={description} maxLength={5000} rows={4} onChange={(e) => setDescription(e.target.value)} />
      <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={detailsState.isLoading} disabled={!dirty}>
        {dirty ? t("subtitles.publish.save", "Save details") : t("subtitles.publish.savedState", "Details saved")}
      </Button>

      <div className="tm-sub-privacy">
        <div>
          <strong>{t("subtitles.publish.visibility", "Who can watch")}</strong>
          <Typography.Text type="secondary" className="tm-sub-help">
            {isPublic
              ? t("subtitles.publish.publicHelp", "Public: listed in the library for everyone signed in.")
              : t("subtitles.publish.privateHelp", "Private: only you, and people you share it with through a course or purchase.")}
          </Typography.Text>
        </div>
        <Popconfirm
          title={isPublic ? t("subtitles.publish.makePrivateQ", "Make this recording private?") : t("subtitles.publish.makePublicQ", "Make this recording public?")}
          onConfirm={() => togglePrivacy(!isPublic)}
          okText={t("subtitles.publish.confirm", "Yes")}
        >
          <Switch checked={isPublic} loading={privacyState.isLoading} checkedChildren={t("subtitles.public", "Public")} unCheckedChildren={t("subtitles.private", "Private")} aria-label={t("subtitles.publish.visibility", "Who can watch")} />
        </Popconfirm>
      </div>

      <Space wrap>
        <Link to={`/video-subtitles/library/${recording.id}`}>
          <Button icon={<EyeOutlined />}>{t("subtitles.publish.watch", "Watch the recording")}</Button>
        </Link>
        <Link to="/video-subtitles/mylibrary">
          <Button type="link">{t("subtitles.publish.myVideos", "Go to My Videos")}</Button>
        </Link>
      </Space>
    </div>
  );
}

PublishPanel.propTypes = {
  recording: PropTypes.object.isRequired,
  details: PropTypes.object,
  segmentCount: PropTypes.number,
  captionCount: PropTypes.number,
  pendingUploads: PropTypes.number,
  onDirtyChange: PropTypes.func,
};
