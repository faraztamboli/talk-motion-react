import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, Popconfirm, Result, Skeleton, Space, Switch, Tag, Typography, message } from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import SubtitledVideoPlayer from "./SubtitledVideoPlayer";
import { useGetRecordingDetailsQuery, useSetRecordingPrivacyMutation } from "../recordingsApi";
import { rpcErrorMessage } from "../../../api/rpc";
import ErrorBoundary from "../../../components/ErrorBoundary";
import "../videoSubtitles.css";

/** /video-subtitles/library/:recordingId — watch a recording with its signer and captions. */
export default function RecordingViewer() {
  const { t } = useTranslation();
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { data, error, isLoading, refetch } = useGetRecordingDetailsQuery(recordingId, { skip: !recordingId });
  const [setPrivacy, privacyState] = useSetRecordingPrivacyMutation();

  if (isLoading) {
    return (
      <div className="tm-sub-page">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !data) {
    const notFound = error?.code === "not_found";
    return (
      <div className="tm-sub-page">
        <Result
          status={notFound ? "404" : "warning"}
          title={notFound ? t("subtitles.viewer.notFound", "This recording isn't available") : t("subtitles.viewer.loadFailed", "The recording couldn't be loaded")}
          subTitle={notFound ? t("subtitles.viewer.notFoundHelp", "It may have been deleted, or it isn't shared with you.") : rpcErrorMessage(error)}
          extra={[
            !notFound && (
              <Button key="retry" type="primary" onClick={refetch}>
                {t("subtitles.tryAgain", "Try again")}
              </Button>
            ),
            <Link key="library" to="/video-subtitles/library">
              <Button>{t("subtitles.viewer.toLibrary", "Browse the library")}</Button>
            </Link>,
          ].filter(Boolean)}
        />
      </div>
    );
  }

  const { recording, playable, captions, canEdit } = data;

  const togglePrivacy = async (next) => {
    const res = await setPrivacy({ id: recording.id, isPublic: next });
    if (res.error) messageApi.error(rpcErrorMessage(res.error));
    else messageApi.success(next ? t("subtitles.publish.nowPublic", "Anyone signed in can now find and watch it.") : t("subtitles.publish.nowPrivate", "Only you (and people you share it with) can watch it now."));
  };

  return (
    <div className="tm-sub-page tm-viewer-page">
      {contextHolder}
      <header className="tm-viewer-header">
        <div>
          <Typography.Title level={2}>{recording.title}</Typography.Title>
          <Space size="small" wrap>
            <Avatar size="small" src={recording.creator?.img || undefined} icon={<UserOutlined />} />
            <Typography.Text type="secondary">{recording.creator?.fullname || recording.creator?.username || recording.owner}</Typography.Text>
            {recording.youtubeAuthor && (
              <Typography.Text type="secondary">
                · {t("subtitles.viewer.videoBy", "video by {{author}}", { author: recording.youtubeAuthor })}
              </Typography.Text>
            )}
            {captions.length > 0 && <Tag>{t("subtitles.viewer.hasCaptions", "Captions")}</Tag>}
          </Space>
        </div>
        {canEdit && (
          <Space wrap>
            <Popconfirm
              title={recording.isPublic ? t("subtitles.publish.makePrivateQ", "Make this recording private?") : t("subtitles.publish.makePublicQ", "Make this recording public?")}
              onConfirm={() => togglePrivacy(!recording.isPublic)}
              okText={t("subtitles.publish.confirm", "Yes")}
            >
              <Switch
                checked={recording.isPublic}
                loading={privacyState.isLoading}
                checkedChildren={t("subtitles.public", "Public")}
                unCheckedChildren={t("subtitles.private", "Private")}
                aria-label={t("subtitles.publish.visibility", "Who can watch")}
              />
            </Popconfirm>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/video-subtitles/designer/${recording.id}`)}>
              {t("subtitles.viewer.edit", "Edit")}
            </Button>
          </Space>
        )}
      </header>

      <ErrorBoundary>
        <SubtitledVideoPlayer videoId={recording.videoId} shots={playable} captions={captions} />
      </ErrorBoundary>

      {recording.description && (
        <Typography.Paragraph className="tm-viewer-description">{recording.description}</Typography.Paragraph>
      )}
    </div>
  );
}
