import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { Alert, Button, Card, Modal, Result, Spin, Typography, message } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled, CheckOutlined, ExclamationCircleFilled, LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import useRecorderCamera from "../useRecorderCamera";
import useDesignerSession from "./useDesignerSession";
import useTakePlayback, { playbackTakes } from "./useTakePlayback";
import VideoChooser from "./VideoChooser";
import CandidatePanel from "./CandidatePanel";
import StagePlayer from "./StagePlayer";
import RecordBar from "./RecordBar";
import Timeline from "./Timeline";
import TakeList from "./TakeList";
import PublishStep from "./PublishStep";
import CaptionStudio from "../captions/CaptionStudio";
import { formatDuration, saveSummary, signedSeconds, takeRows } from "./takes";
import { useDeleteShotMutation, useGetRecordingDetailsQuery } from "../recordingsApi";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { rpcErrorMessage } from "../../../api/rpc";
import "../videoSubtitles.css";
import "../studio.css";

const STEPS = ["choose", "sign", "captions", "publish"];
const PENDING = new Set(["recording", "stopping", "queued", "uploading"]);
const COUNTDOWN_FROM = 3;

/**
 * Subtitle Designer: put your sign-language interpretation (and, if you like, text captions)
 * on a YouTube video.
 *
 *   1 Choose a video   2 Sign   3 Captions (optional)   4 Publish
 *
 * Signing is recorded in "takes": press Record, a countdown gives you time to get ready, the
 * video plays and your camera records you, picture-in-picture, exactly where viewers will see
 * you. Stop whenever you like; every take saves by itself. "Watch back" plays the video with
 * your takes on top, straight away, even while they are still uploading.
 */
export default function SubtitleDesigner() {
  const { t } = useTranslation();
  const { recordingId: routeRecordingId } = useParams();
  const dispatch = useDispatch();
  const camera = useRecorderCamera();
  const session = useDesignerSession({ existingRecordingId: routeRecordingId, stream: camera.stream, dispatch });
  const { candidate, recording, player, segments } = session;
  const [messageApi, contextHolder] = message.useMessage();

  const [step, setStep] = useState(routeRecordingId ? "sign" : "choose");
  const [mode, setMode] = useState("record"); // on the Sign step: record | watch
  const [countdown, setCountdown] = useState(null);
  const [wantRecord, setWantRecord] = useState(false); // waiting for the camera, then the countdown
  const [selectedKey, setSelectedKey] = useState(null);
  const [captionsDirty, setCaptionsDirty] = useState(false);
  const [captionsSave, setCaptionsSave] = useState("idle");
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [pollMs, setPollMs] = useState(0);
  const [deleteShot] = useDeleteShotMutation();

  const { data: details, refetch: refetchDetails } = useGetRecordingDetailsQuery(recording?.id, {
    skip: !recording?.id || recording?.readOnly,
    pollingInterval: pollMs,
  });

  // ---------------------------------------------------------------- takes

  const rows = useMemo(() => takeRows(segments, details?.shots, player.time), [segments, details, player.time]);
  const playback = useMemo(() => playbackTakes(segments, details?.shots), [segments, details]);
  const watching = step === "sign" && mode === "watch";
  const takePlayback = useTakePlayback({ getPlayer: session.getPlayer, takes: playback, active: watching });
  const pendingUploads = segments.filter((s) => PENDING.has(s.status) || (s.status === "failed" && s.blob)).length;
  const preparing = rows.filter((r) => r.status === "processing").length;
  const keptTakes = rows.filter((r) => ["saved", "complete", "processing", "uploading", "queued"].includes(r.status));
  const captionCount = useMemo(() => (details?.captions || []).reduce((n, tr) => n + tr.cues.length, 0), [details]);
  const summary = saveSummary(rows, { captionsSaving: captionsSave === "saving" || captionsDirty, captionsError: captionsSave === "error" });

  // Takes being prepared on the server that this page isn't following itself: ask again
  // every few seconds until they are ready.
  const localShotIds = useMemo(() => new Set(segments.map((s) => String(s.shotId)).filter(Boolean)), [segments]);
  const serverPreparing = (details?.shots || []).some((s) => s.status === "processing" && !localShotIds.has(String(s.id)));
  useEffect(() => setPollMs(serverPreparing ? 5000 : 0), [serverPreparing]);

  // A take finished: refresh the server's list (status, file URL).
  const savedLocal = segments.filter((s) => s.status === "saved").length;
  useEffect(() => {
    if (savedLocal && recording?.id) refetchDetails();
  }, [savedLocal]);

  // ---------------------------------------------------------------- leaving with unsaved work

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

  // Information notices fade by themselves; errors stay until dismissed.
  useEffect(() => {
    if (!session.notice || session.notice.type === "error") return undefined;
    const timer = setTimeout(session.dismissNotice, 8000);
    return () => clearTimeout(timer);
  }, [session.notice]);

  // ---------------------------------------------------------------- recording

  const cancelCountdown = useCallback(() => {
    setCountdown(null);
    setWantRecord(false);
  }, []);

  useEffect(() => {
    if (countdown == null) return undefined;
    if (countdown <= 0) {
      setCountdown(null);
      session.startRecording();
      return undefined;
    }
    const timer = setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const beginCountdown = () => {
    session.pause();
    setCountdown(COUNTDOWN_FROM);
  };

  const onRecord = () => {
    setMode("record");
    if (camera.status !== "on" || !session.canRecord) {
      setWantRecord(true);
      if (camera.status !== "on" && camera.status !== "opening") camera.start();
      return;
    }
    beginCountdown();
  };

  // "Turn on camera and record": once the camera is on, count down.
  useEffect(() => {
    if (!wantRecord) return;
    if (camera.status === "on" && session.canRecord) {
      setWantRecord(false);
      beginCountdown();
    } else if (camera.status === "error") setWantRecord(false);
  }, [wantRecord, camera.status, session.canRecord]);

  const onStop = () => {
    if (countdown != null || wantRecord) cancelCountdown();
    else session.disarm();
  };

  const recordingRow = rows.find((r) => r.status === "recording");
  let badge = null;
  if (step === "sign" && mode === "record") {
    if (recordingRow) badge = { tone: "rec", text: `${t("subtitles.badge.rec", "Recording")} ${formatDuration(player.time - recordingRow.start)}` };
    else if (session.isArmed) badge = { tone: "paused", text: t("subtitles.badge.paused", "Paused. Play the video to continue recording.") };
  } else if (watching && player.playing && !takePlayback.activeId) {
    badge = { tone: "info", text: t("subtitles.badge.noSigning", "No signing at this point") };
  }

  // ---------------------------------------------------------------- takes: actions

  const selectTake = (row) => {
    setSelectedKey(row.key);
    session.seekTo(row.start);
  };

  const watchTake = (row) => {
    setSelectedKey(row.key);
    setMode("watch");
    session.seekTo(row.start);
    session.play();
  };

  const rerecordTake = (row) => {
    setSelectedKey(row.key);
    setMode("record");
    session.pause();
    session.seekTo(row.start);
    messageApi.info(t("subtitles.take.rerecordReady", "The video is at the start of take {{n}}. Press Record to sign it again.", { n: row.number }));
  };

  const removeTake = async (row) => {
    if (row.source === "local") {
      await session.removeSegment(row.localId);
      return;
    }
    const res = await deleteShot({ recordingId: recording.id, shotId: row.shotId });
    if (res.error) Modal.error({ title: t("subtitles.deleteFailed", "The take couldn't be deleted"), content: rpcErrorMessage(res.error) });
  };

  // ---------------------------------------------------------------- steps

  const goTo = async (next) => {
    if (next !== "choose" && !recording) return;
    if (countdown != null || wantRecord) cancelCountdown();
    if (session.isArmed) await session.disarm();
    if (next !== "sign") setMode("record");
    session.pause();
    setStep(next);
    if (!/jsdom/i.test(navigator.userAgent)) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Edit mode lands on Sign once the recording is loaded.
  useEffect(() => {
    if (routeRecordingId && recording && !recording.readOnly) setStep((s) => (s === "choose" ? "sign" : s));
  }, [routeRecordingId, recording]);

  const onChoose = useCallback(
    (urlOrId, hint) => {
      const go = async () => {
        if (recording) await session.changeVideo();
        session.checkVideo(urlOrId, { title: hint?.title, author: hint?.channelTitle, description: hint?.description });
      };
      if (recording && pendingUploads > 0) {
        Modal.warning({
          title: t("subtitles.waitUploads", "Your signing is still saving"),
          content: t("subtitles.waitUploadsBody", "Wait until it's saved before choosing another video."),
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
    if (created) setStep("sign");
  };

  // ---------------------------------------------------------------- page states

  if (session.loadError) {
    return (
      <div className="tm-sub-page">
        <Result
          status={session.loadError.notFound ? "404" : "warning"}
          title={session.loadError.notFound ? t("subtitles.viewer.notFound", "This recording isn't available") : t("subtitles.loadFailed", "Your recording couldn't be opened")}
          subTitle={session.loadError.notFound ? t("subtitles.viewer.notFoundHelp", "It may have been deleted, or it isn't shared with you.") : session.loadError.message}
          extra={[
            !session.loadError.notFound && (
              <Button key="retry" type="primary" onClick={session.reload}>
                {t("subtitles.tryAgain", "Try again")}
              </Button>
            ),
            <Link key="mine" to="/video-subtitles/mylibrary">
              <Button>{t("subtitles.publish.myVideos", "Go to My Videos")}</Button>
            </Link>,
          ].filter(Boolean)}
        />
      </div>
    );
  }

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

  const stepLabels = {
    choose: t("subtitles.step.choose", "Choose a video"),
    sign: t("subtitles.step.sign", "Sign"),
    captions: t("subtitles.step.captions", "Captions"),
    publish: t("subtitles.step.publish", "Publish"),
  };
  const stepDone = {
    choose: Boolean(recording),
    sign: keptTakes.length > 0,
    captions: captionCount > 0,
    publish: false,
  };
  const title = details?.recording?.title || candidate?.meta?.title || t("subtitles.newVideo", "New subtitled video");
  const overlay = step === "sign" ? (mode === "record" ? "camera" : "takes") : "none";
  const SaveIcon = summary.tone === "ok" ? CheckCircleFilled : summary.tone === "error" ? ExclamationCircleFilled : LoadingOutlined;

  return (
    <div className="tm-sub-page tm-studio">
      {contextHolder}
      <header className="tm-studio-head">
        <Link to="/video-subtitles/mylibrary" className="tm-studio-back">
          <ArrowLeftOutlined aria-hidden /> {t("subtitles.myVideos", "My videos")}
        </Link>
        <div className="tm-studio-name">
          <Typography.Title level={2} className="tm-studio-title" ellipsis={{ tooltip: title }}>
            {recording ? title : t("subtitles.designerTitle", "Subtitle Designer")}
          </Typography.Title>
          {recording && (
            <span className={`tm-save is-${summary.tone}`} role="status" aria-live="polite">
              <SaveIcon aria-hidden /> {t(`subtitles.save.${summary.tone}`, summary.text)}
            </span>
          )}
        </div>
        {!recording && (
          <Typography.Text type="secondary">
            {t("subtitles.designerIntro", "Add your sign-language interpretation, and text captions, to a YouTube video.")}
          </Typography.Text>
        )}
      </header>

      <nav className="tm-steps" aria-label={t("subtitles.stepsNav", "Designer steps")}>
        {STEPS.map((s, i) => (
          <button
            type="button"
            key={s}
            className={`tm-step ${step === s ? "is-current" : ""} ${stepDone[s] ? "is-done" : ""}`}
            aria-current={step === s ? "step" : undefined}
            disabled={s !== "choose" && !recording}
            onClick={() => goTo(s)}
          >
            <span className="tm-step-n" aria-hidden>
              {stepDone[s] && step !== s ? <CheckOutlined /> : i + 1}
            </span>
            <span className="tm-step-label">
              {stepLabels[s]}
              {s === "captions" && <small>{t("subtitles.step.optional", "optional")}</small>}
            </span>
          </button>
        ))}
      </nav>

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

      {step === "choose" && (
        <Card className="tm-sub-card" title={t("subtitles.findVideo", "Find a YouTube video")}>
          <VideoChooser onChoose={onChoose} selectedVideoId={candidate?.videoId} />
        </Card>
      )}

      {candidate && (
        <div className={`tm-studio-grid is-${step}`} hidden={step === "publish"}>
          <div className="tm-studio-left">
            <StagePlayer
              containerRef={session.playerContainerRef}
              playerError={player.error?.message || (candidate.status === "error" && step !== "choose" ? candidate.error : null)}
              playerLoading={candidate.status === "loading" || candidate.status === "checking"}
              overlay={overlay}
              camera={camera}
              takeVideoRef={takePlayback.videoRef}
              takeShowing={Boolean(takePlayback.activeId)}
              countdown={countdown}
              onCancelCountdown={cancelCountdown}
              badge={badge}
            />
            {step === "sign" && (
              <RecordBar
                mode={mode}
                onModeChange={(next) => {
                  session.pause();
                  setMode(next);
                }}
                engineState={session.engineState}
                isArmed={session.isArmed}
                counting={countdown != null || wantRecord}
                time={player.time}
                playing={player.playing}
                camera={camera}
                onRecord={onRecord}
                onStop={onStop}
                onPlayPause={() => (player.playing ? session.pause() : session.play())}
                canRecord={Boolean(recording) && candidate.status === "ready"}
              />
            )}
            {(step === "sign" || step === "captions") && (
              <Timeline
                duration={player.duration}
                time={player.time}
                takes={rows}
                cues={details?.captions?.[0]?.cues || []}
                selectedKey={selectedKey}
                onSeek={session.seekTo}
                onSelectTake={(row) => setSelectedKey(row.key)}
                disabled={session.engineState === "recording"}
              />
            )}
          </div>

          <aside className="tm-studio-right">
            <ErrorBoundary compact>
              {step === "choose" && (!recording || recording.videoId !== candidate.videoId) && (
                <CandidatePanel candidate={candidate} creating={session.creating} onCommit={onCommit} />
              )}
              {step === "choose" && recording && recording.videoId === candidate.videoId && (
                <div className="tm-sub-center">
                  <Typography.Text>{t("subtitles.alreadyUsing", "You're recording with this video.")}</Typography.Text>
                  <Button type="primary" onClick={() => goTo("sign")}>
                    {t("subtitles.backToRecording", "Back to signing")}
                  </Button>
                </div>
              )}
              {step === "sign" && (
                <>
                  <div className="tm-side-head">
                    <Typography.Title level={4}>{t("subtitles.takes.title", "Your takes")}</Typography.Title>
                    {keptTakes.length > 0 && (
                      <span className="tm-side-meta">{t("subtitles.takes.total", "{{length}} of signing", { length: formatDuration(signedSeconds(rows)) })}</span>
                    )}
                  </div>
                  <TakeList
                    rows={rows}
                    selectedKey={selectedKey}
                    onSelect={selectTake}
                    onWatch={watchTake}
                    onRerecord={rerecordTake}
                    onRetry={session.retry}
                    onRemove={removeTake}
                    recording={session.isArmed || countdown != null}
                  />
                </>
              )}
              {step === "captions" && recording && (
                <CaptionStudio
                  recordingId={recording.id}
                  tracks={details?.captions || []}
                  captionsAvailable={details ? details.captionsAvailable : true}
                  getTimeMs={session.currentTimeMs}
                  playerTimeMs={Math.round(player.time * 1000)}
                  playing={player.playing}
                  onSeek={session.seekTo}
                  onPlay={session.play}
                  onPause={session.pause}
                  onDirtyChange={setCaptionsDirty}
                  onSaveStateChange={setCaptionsSave}
                />
              )}
            </ErrorBoundary>
          </aside>
        </div>
      )}

      {step === "publish" && recording && (
        <PublishStep
          recording={recording}
          details={details}
          takeCount={keptTakes.length}
          signedSeconds={signedSeconds(rows)}
          preparing={preparing}
          pendingUploads={pendingUploads}
          captionCount={captionCount}
          onDirtyChange={setDetailsDirty}
        />
      )}

      {recording && (
        <nav className="tm-sub-nav tm-studio-nav" aria-label={t("subtitles.stepsNav", "Designer steps")}>
          {step === "sign" && <Button onClick={() => goTo("choose")}>{t("subtitles.back", "Back")}</Button>}
          {step === "captions" && <Button onClick={() => goTo("sign")}>{t("subtitles.backToSigning", "Back to signing")}</Button>}
          {step === "publish" && <Button onClick={() => goTo("captions")}>{t("subtitles.backToCaptions", "Back to captions")}</Button>}
          {step === "choose" && <span />}
          {step === "sign" && (
            <Button type="primary" size="large" onClick={() => goTo("captions")}>
              {t("subtitles.nextCaptions", "Next: captions")}
            </Button>
          )}
          {step === "captions" && (
            <Button type="primary" size="large" onClick={() => goTo("publish")}>
              {captionCount || captionsDirty ? t("subtitles.nextPublish", "Next: publish") : t("subtitles.skipCaptions", "Skip captions and publish")}
            </Button>
          )}
        </nav>
      )}

      {!candidate && step === "choose" && (
        <Typography.Paragraph type="secondary" className="tm-sub-hint">
          {t("subtitles.startHint", "Start by finding a video. Only videos their owners allow on other sites can be used.")}
        </Typography.Paragraph>
      )}
    </div>
  );
}
