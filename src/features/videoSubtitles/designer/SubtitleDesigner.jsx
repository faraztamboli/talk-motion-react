import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { Alert, Button, Card, Collapse, Modal, Result, Space, Spin, Steps, Tabs, Typography } from "antd";
import { EditOutlined, PlayCircleOutlined, RobotOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import useRecorderCamera from "../useRecorderCamera";
import useDesignerSession from "./useDesignerSession";
import VideoChooser from "./VideoChooser";
import CandidatePanel from "./CandidatePanel";
import CameraPanel from "./CameraPanel";
import SegmentList from "./SegmentList";
import PublishPanel from "./PublishPanel";
import CaptionEditor from "../captions/CaptionEditor";
import { useDeleteShotMutation, useGetRecordingDetailsQuery, useSetRecordingDetailsMutation } from "../recordingsApi";
import ErrorBoundary from "../../../components/ErrorBoundary";
import AIContentGenerator from "../../../components/ui/AIContentGenerator";
import { rpcErrorMessage } from "../../../api/rpc";
import "../videoSubtitles.css";

const PENDING = new Set(["recording", "stopping", "queued", "uploading"]);

/**
 * Subtitle Designer: 1) choose a YouTube video, 2) record your signing in sync with it and add
 * text captions, 3) title, description and who can watch.
 */
export default function SubtitleDesigner() {
  const { t } = useTranslation();
  const { recordingId: routeRecordingId } = useParams();
  const dispatch = useDispatch();
  const camera = useRecorderCamera();
  const session = useDesignerSession({ existingRecordingId: routeRecordingId, stream: camera.stream, dispatch });
  const { candidate, recording, player, segments } = session;
  const [step, setStep] = useState(routeRecordingId ? 1 : 0);
  const [tab, setTab] = useState("sign");
  const [captionsDirty, setCaptionsDirty] = useState(false);
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [deleteShot] = useDeleteShotMutation();
  const [setDetails] = useSetRecordingDetailsMutation();

  const { data: details, refetch: refetchDetails } = useGetRecordingDetailsQuery(recording?.id, { skip: !recording?.id || recording?.readOnly });

  const pendingUploads = segments.filter((s) => PENDING.has(s.status) || (s.status === "failed" && s.blob)).length;
  const savedSegments = useMemo(() => {
    const local = segments.filter((s) => s.status === "saved").length;
    const localIds = new Set(segments.map((s) => s.shotId).filter(Boolean));
    const server = (details?.shots || []).filter((s) => s.videoUrl && !localIds.has(s.id)).length;
    return local + server;
  }, [segments, details]);
  const captionCount = useMemo(() => (details?.captions || []).reduce((n, tr) => n + tr.cues.length, 0), [details]);

  // Refresh the server's list when a segment finishes uploading (status, file URL).
  const savedLocal = segments.filter((s) => s.status === "saved").length;
  useEffect(() => {
    if (savedLocal && recording?.id) refetchDetails();
  }, [savedLocal]);

  // Don't let people close the tab on unsent work.
  const unsafeToLeave = pendingUploads > 0 || captionsDirty || detailsDirty || session.isArmed;
  useEffect(() => {
    if (!unsafeToLeave) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsafeToLeave]);

  // Edit mode lands on the recording step once the recording is loaded.
  useEffect(() => {
    if (routeRecordingId && recording && !recording.readOnly) setStep((s) => (s === 0 ? 1 : s));
  }, [routeRecordingId, recording]);

  const onChoose = useCallback(
    (urlOrId, hint) => {
      const go = async () => {
        if (recording) await session.changeVideo();
        session.checkVideo(urlOrId, { title: hint?.title, author: hint?.channelTitle, description: hint?.description });
      };
      if (recording && pendingUploads > 0) {
        Modal.warning({
          title: t("subtitles.waitUploads", "Segments are still uploading"),
          content: t("subtitles.waitUploadsBody", "Wait until they're saved before choosing another video."),
        });
        return;
      }
      if (recording) {
        Modal.confirm({
          title: t("subtitles.newRecordingQ", "Start a new recording with this video?"),
          content: t("subtitles.newRecordingBody", "Your current recording stays in My Videos."),
          okText: t("subtitles.newRecording", "Start a new recording"),
          onOk: go,
        });
        return;
      }
      go();
    },
    [pendingUploads, recording, session, t]
  );

  const onCommit = async (values) => {
    const created = await session.commitVideo(values);
    if (created) setStep(1);
  };

  const removeServerShot = async (shotId) => {
    const res = await deleteShot({ recordingId: recording.id, shotId });
    if (res.error) Modal.error({ title: t("subtitles.deleteFailed", "The segment couldn't be deleted"), content: rpcErrorMessage(res.error) });
  };

  const goToStep = (next) => {
    if (next > 0 && !recording) return;
    if (next === 0 && session.isArmed) session.disarm();
    setStep(next);
  };

  if (session.loadingExisting) {
    return (
      <div className="tm-sub-page tm-sub-center tm-sub-loading">
        <Spin size="large" />
        <Typography.Text type="secondary">{t("subtitles.loadingRecording", "Opening your recording…")}</Typography.Text>
      </div>
    );
  }

  if (recording?.readOnly) {
    return (
      <div className="tm-sub-page">
        <Result
          status="403"
          title={t("subtitles.notYours", "Only the person who made this recording can edit it")}
          extra={
            <Link to={`/video-subtitles/library/${recording.id}`}>
              <Button type="primary">{t("subtitles.watchInstead", "Watch it instead")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const steps = [
    { title: t("subtitles.step.choose", "Choose a video"), icon: <PlayCircleOutlined /> },
    { title: t("subtitles.step.record", "Record and caption"), icon: <VideoCameraOutlined />, disabled: !recording },
    { title: t("subtitles.step.publish", "Review and publish"), icon: <EditOutlined />, disabled: !recording },
  ];

  return (
    <div className="tm-sub-page">
      <header className="tm-sub-header">
        <Typography.Title level={2}>{t("subtitles.designerTitle", "Subtitle Designer")}</Typography.Title>
        <Typography.Text type="secondary">
          {t("subtitles.designerIntro", "Add your sign-language interpretation, and text captions, to a YouTube video.")}
        </Typography.Text>
      </header>

      <Steps current={step} onChange={goToStep} items={steps} className="tm-sub-steps" responsive />

      {session.notice && (
        <Alert
          className="tm-sub-notice"
          type={session.notice.type === "error" ? "error" : "info"}
          showIcon
          closable
          message={session.notice.message}
          onClose={session.dismissNotice}
        />
      )}

      {step === 0 && (
        <Card className="tm-sub-card" title={t("subtitles.findVideo", "Find a YouTube video")}>
          <VideoChooser onChoose={onChoose} selectedVideoId={candidate?.videoId} />
        </Card>
      )}

      {candidate && (
        <div className="tm-sub-stage">
          <div className="tm-sub-player-wrap">
            <div className="tm-sub-player" ref={session.playerContainerRef} />
            {player.error && (
              <div className="tm-sub-player-error" role="alert">
                <strong>{t("subtitles.playerError", "The video can't play")}</strong>
                <span>{player.error.message}</span>
              </div>
            )}
          </div>
          <aside className="tm-sub-side">
            <ErrorBoundary compact>
              {step === 0 && (!recording || recording.videoId !== candidate.videoId) && (
                <CandidatePanel candidate={candidate} creating={session.creating} onCommit={onCommit} />
              )}
              {step === 0 && recording && recording.videoId === candidate.videoId && (
                <div className="tm-sub-center">
                  <Typography.Text>{t("subtitles.alreadyUsing", "You're recording with this video.")}</Typography.Text>
                  <Button type="primary" onClick={() => setStep(1)}>
                    {t("subtitles.backToRecording", "Back to recording")}
                  </Button>
                </div>
              )}
              {step === 1 && recording && (
                <CameraPanel
                  camera={camera}
                  engineState={session.engineState}
                  isArmed={session.isArmed}
                  canRecord={session.canRecord}
                  onArm={session.arm}
                  onDisarm={session.disarm}
                  pendingUploads={pendingUploads}
                />
              )}
              {step === 2 && recording && (
                <PublishPanel
                  recording={recording}
                  details={details}
                  segmentCount={savedSegments}
                  captionCount={captionCount}
                  pendingUploads={pendingUploads}
                  onDirtyChange={setDetailsDirty}
                />
              )}
            </ErrorBoundary>
          </aside>
        </div>
      )}

      {step === 1 && recording && (
        <Card className="tm-sub-card">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: "sign",
                label: t("subtitles.tab.sign", "Sign-language segments"),
                children: (
                  <ErrorBoundary compact>
                    <SegmentList
                      segments={segments}
                      serverShots={details?.shots || []}
                      duration={player.duration}
                      onSeek={session.seekTo}
                      onRetry={session.retry}
                      onRemove={session.removeSegment}
                      onRemoveServerShot={removeServerShot}
                    />
                  </ErrorBoundary>
                ),
              },
              {
                key: "captions",
                label: `${t("subtitles.tab.captions", "Text captions")}${captionsDirty ? " •" : ""}`,
                forceRender: true,
                children: (
                  <ErrorBoundary compact>
                    <CaptionEditor
                      recordingId={recording.id}
                      tracks={details?.captions || []}
                      captionsAvailable={details ? details.captionsAvailable : true}
                      canEdit
                      getTimeMs={session.currentTimeMs}
                      playerTimeMs={Math.round(player.time * 1000)}
                      onSeek={session.seekTo}
                      onPlay={session.play}
                      onDirtyChange={setCaptionsDirty}
                    />
                  </ErrorBoundary>
                ),
              },
            ]}
          />
        </Card>
      )}

      {step === 2 && recording && (
        <Collapse
          className="tm-sub-card"
          items={[
            {
              key: "ai",
              label: (
                <Space>
                  <RobotOutlined />
                  <span>{t("subtitles.ai", "AI assistant: draft a description or summary")}</span>
                </Space>
              ),
              children: (
                <ErrorBoundary compact>
                  <div className="tm-sub-ai">
                    <AIContentGenerator
                      targetType="video"
                      targetId={recording.id}
                      contentType="description"
                      existingContent={details?.recording?.description || ""}
                      onContentApproved={(content) => setDetails({ id: recording.id, description: content })}
                    />
                    <AIContentGenerator targetType="video" targetId={recording.id} contentType="summary" existingContent="" />
                  </div>
                </ErrorBoundary>
              ),
            },
          ]}
        />
      )}

      {recording && (
        <nav className="tm-sub-nav" aria-label={t("subtitles.stepsNav", "Designer steps")}>
          {step > 0 ? <Button onClick={() => goToStep(step - 1)}>{t("subtitles.back", "Back")}</Button> : <span />}
          {step < 2 && step > 0 && (
            <Button type="primary" onClick={() => goToStep(step + 1)}>
              {t("subtitles.nextReview", "Next: review and publish")}
            </Button>
          )}
        </nav>
      )}

      {!candidate && step === 0 && (
        <Typography.Paragraph type="secondary" className="tm-sub-hint">
          {t("subtitles.startHint", "Start by finding a video. Only videos their owners allow on other sites can be used.")}
        </Typography.Paragraph>
      )}
    </div>
  );
}
