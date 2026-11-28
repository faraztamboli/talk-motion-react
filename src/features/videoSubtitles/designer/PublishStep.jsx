import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Alert, Button, Collapse, Input, Modal, Typography, message } from "antd";
import { CheckCircleFilled, GlobalOutlined, LoadingOutlined, LockOutlined, RobotOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import SubtitledVideoPlayer from "../viewer/SubtitledVideoPlayer";
import { useSetRecordingDetailsMutation, useSetRecordingPrivacyMutation } from "../recordingsApi";
import { rpcErrorMessage } from "../../../api/rpc";
import ErrorBoundary from "../../../components/ErrorBoundary";
import AIContentGenerator from "../../../components/ui/AIContentGenerator";
import { formatDuration } from "./takes";

const DETAILS_SAVE_MS = 900;

/**
 * Last step: watch it exactly as viewers will, name it, and choose who can watch.
 * Title and description save by themselves.
 */
export default function PublishStep({ recording, details, takeCount, signedSeconds, preparing, pendingUploads, captionCount, onDirtyChange }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const savedTitle = details?.recording?.ownTitle || details?.recording?.title || "";
  const savedDescription = details?.recording?.description || "";
  const [title, setTitle] = useState(savedTitle);
  const [description, setDescription] = useState(savedDescription);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [setDetails] = useSetRecordingDetailsMutation();
  const [setPrivacy, privacyState] = useSetRecordingPrivacyMutation();
  const isPublic = Boolean(details?.recording?.isPublic);
  const seq = useRef(0);

  useEffect(() => {
    setTitle(savedTitle);
    setDescription(savedDescription);
  }, [savedTitle, savedDescription]);

  const dirty = title !== savedTitle || description !== savedDescription;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty || !title.trim()) return undefined;
    const timer = setTimeout(async () => {
      const mine = ++seq.current;
      setSaveStatus("saving");
      const res = await setDetails({ id: recording.id, title: title.trim(), description });
      if (mine !== seq.current) return;
      if (res.error) {
        setSaveStatus("error");
        messageApi.error(rpcErrorMessage(res.error, t("subtitles.publish.saveFailed", "The details couldn't be saved.")));
      } else setSaveStatus("saved");
    }, DETAILS_SAVE_MS);
    return () => clearTimeout(timer);
  }, [title, description, dirty]);

  const choosePrivacy = (next) => {
    if (next === isPublic) return;
    const go = async () => {
      const res = await setPrivacy({ id: recording.id, isPublic: next });
      if (res.error) messageApi.error(rpcErrorMessage(res.error, t("subtitles.publish.privacyFailed", "Who can see the recording couldn't be changed.")));
      else messageApi.success(next ? t("subtitles.publish.nowPublic", "Anyone signed in can now find and watch it.") : t("subtitles.publish.nowPrivate", "Only you (and people you share it with) can watch it now."));
    };
    if (next) {
      Modal.confirm({
        title: t("subtitles.publish.makePublicQ", "Make this recording public?"),
        content: t("subtitles.publish.publicHelp", "It will be listed in the library for everyone signed in."),
        okText: t("subtitles.publish.makePublic", "Make it public"),
        onOk: go,
      });
    } else go();
  };

  return (
    <div className="tm-publish">
      {contextHolder}
      <div className="tm-publish-preview">
        <Typography.Title level={4}>{t("subtitles.publish.previewTitle", "Your video, as viewers will see it")}</Typography.Title>
        {(preparing > 0 || pendingUploads > 0) && (
          <Alert
            className="tm-publish-alert"
            type="info"
            showIcon
            message={
              pendingUploads > 0
                ? t("subtitles.publish.pending", "Your signing is still saving. Keep this page open until it's done.")
                : t("subtitles.publish.preparing", "Your newest signing is being prepared. It appears here in a minute or two.")
            }
          />
        )}
        <ErrorBoundary compact>
          <SubtitledVideoPlayer videoId={recording.videoId} shots={details?.playable || []} captions={details?.captions || []} />
        </ErrorBoundary>
      </div>

      <aside className="tm-publish-side">
        <ul className="tm-publish-summary">
          <li className={takeCount ? "is-done" : ""}>
            {takeCount ? <CheckCircleFilled aria-hidden /> : <span className="tm-dot" aria-hidden />}
            {takeCount
              ? t("subtitles.publish.signingSummary", "Signing: {{count}} take(s), {{length}} in total", { count: takeCount, length: formatDuration(signedSeconds) })
              : t("subtitles.publish.noSigning", "No signing recorded yet")}
          </li>
          <li className={captionCount ? "is-done" : ""}>
            {captionCount ? <CheckCircleFilled aria-hidden /> : <span className="tm-dot" aria-hidden />}
            {captionCount ? t("subtitles.publish.captionSummary", "Captions: {{count}}", { count: captionCount }) : t("subtitles.publish.noCaptions", "No captions (optional)")}
          </li>
        </ul>

        <label htmlFor="tm-pub-title" className="tm-sub-label">
          {t("subtitles.titleLabel", "Title of your recording")}
        </label>
        <Input id="tm-pub-title" size="large" value={title} maxLength={250} onChange={(e) => setTitle(e.target.value)} status={title.trim() ? undefined : "error"} />
        {!title.trim() && <Typography.Text type="danger">{t("subtitles.publish.titleNeeded", "Give your recording a title.")}</Typography.Text>}
        <label htmlFor="tm-pub-description" className="tm-sub-label">
          {t("subtitles.publish.description", "Description (optional)")}
        </label>
        <Input.TextArea id="tm-pub-description" value={description} maxLength={5000} rows={3} onChange={(e) => setDescription(e.target.value)} />
        <span className={`tm-cc-save is-${saveStatus}`} role="status" aria-live="polite">
          {saveStatus === "saving" && (
            <>
              <LoadingOutlined aria-hidden /> {t("subtitles.captions.saving", "Saving…")}
            </>
          )}
          {saveStatus === "saved" && !dirty && (
            <>
              <CheckCircleFilled aria-hidden /> {t("subtitles.publish.detailsSaved", "Details saved")}
            </>
          )}
        </span>

        <fieldset className="tm-publish-who">
          <legend className="tm-sub-label">{t("subtitles.publish.visibility", "Who can watch")}</legend>
          <button type="button" className={`tm-choice ${!isPublic ? "is-on" : ""}`} aria-pressed={!isPublic} disabled={privacyState.isLoading} onClick={() => choosePrivacy(false)}>
            <LockOutlined aria-hidden />
            <span>
              <strong>{t("subtitles.publish.onlyMe", "Only me")}</strong>
              <small>{t("subtitles.publish.privateHelp", "Private: only you, and people you share it with through a course or purchase.")}</small>
            </span>
          </button>
          <button type="button" className={`tm-choice ${isPublic ? "is-on" : ""}`} aria-pressed={isPublic} disabled={privacyState.isLoading} onClick={() => choosePrivacy(true)}>
            <GlobalOutlined aria-hidden />
            <span>
              <strong>{t("subtitles.publish.everyone", "Everyone on TalkMotion")}</strong>
              <small>{t("subtitles.publish.publicHelpShort", "Listed in the library for everyone signed in.")}</small>
            </span>
          </button>
        </fieldset>

        <Link to={`/video-subtitles/library/${recording.id}`} className="tm-publish-done">
          <Button type="primary" size="large" block>
            {t("subtitles.publish.done", "Done: open my video")}
          </Button>
        </Link>
        <Link to="/video-subtitles/mylibrary">
          <Button type="link" block>
            {t("subtitles.publish.myVideos", "Go to My Videos")}
          </Button>
        </Link>

        <Collapse
          ghost
          items={[
            {
              key: "ai",
              label: (
                <span>
                  <RobotOutlined /> {t("subtitles.ai", "Need help writing a description?")}
                </span>
              ),
              children: (
                <ErrorBoundary compact>
                  <AIContentGenerator
                    targetType="video"
                    targetId={recording.id}
                    contentType="description"
                    existingContent={description}
                    onContentApproved={(content) => setDescription(content)}
                  />
                </ErrorBoundary>
              ),
            },
          ]}
        />
      </aside>
    </div>
  );
}

PublishStep.propTypes = {
  recording: PropTypes.object.isRequired,
  details: PropTypes.object,
  takeCount: PropTypes.number,
  signedSeconds: PropTypes.number,
  preparing: PropTypes.number,
  pendingUploads: PropTypes.number,
  captionCount: PropTypes.number,
  onDirtyChange: PropTypes.func,
};
