import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Input, Modal, Progress, Space, Tabs, Typography, Upload } from "antd";
import { InboxOutlined, VideoCameraOutlined, StopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import useConceptVideoUpload from "./useConceptVideoUpload";
import { useRemoveConceptVideoMutation, useSetConceptVideoUrlMutation } from "./modelsApi";

const pickMime = () => {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  return typeof MediaRecorder !== "undefined" ? candidates.find((m) => MediaRecorder.isTypeSupported?.(m)) || "" : "";
};

/** Record a short reference clip with the camera; hands back a File. */
function CameraClip({ onClip, disabled }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | preview | recording | done | error
  const [clipUrl, setClipUrl] = useState(null);
  const [errorText, setErrorText] = useState(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => () => {
    stopStream();
    if (clipUrl) URL.revokeObjectURL(clipUrl);
  }, []);

  const openCamera = async () => {
    setErrorText(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("preview");
    } catch (err) {
      setErrorText(
        err?.name === "NotAllowedError"
          ? t("models.video.cameraBlocked", "Camera access is blocked. Allow it in the address bar and try again.")
          : t("models.video.cameraFailed", "The camera couldn't start.")
      );
      setState("error");
    }
  };

  const record = () => {
    const mimeType = pickMime();
    const chunks = [];
    const rec = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunks, { type });
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `reference.${ext}`, { type: type.split(";")[0] });
      if (clipUrl) URL.revokeObjectURL(clipUrl);
      setClipUrl(URL.createObjectURL(blob));
      stopStream();
      setState("done");
      onClip(file);
    };
    recorderRef.current = rec;
    rec.start();
    setState("recording");
  };

  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();

  return (
    <div className="tm-clip">
      <div className="tm-clip-stage">
        {state === "done" && clipUrl ? (
          <video src={clipUrl} controls playsInline className="tm-clip-video" />
        ) : (
          <video ref={videoRef} muted playsInline className="tm-clip-video tm-mirror" />
        )}
      </div>
      {errorText && <Alert type="error" showIcon message={errorText} />}
      <Space>
        {(state === "idle" || state === "error" || state === "done") && (
          <Button icon={<VideoCameraOutlined />} onClick={openCamera} disabled={disabled}>
            {state === "done" ? t("models.video.recordAgain", "Record again") : t("models.video.openCamera", "Turn on camera")}
          </Button>
        )}
        {state === "preview" && (
          <Button type="primary" danger onClick={record}>
            {t("models.video.startRecording", "Start recording")}
          </Button>
        )}
        {state === "recording" && (
          <Button icon={<StopOutlined />} onClick={stop}>
            {t("models.video.stopRecording", "Stop")}
          </Button>
        )}
      </Space>
    </div>
  );
}

/**
 * Set the reference video for one word or phrase (used by voice-to-sign playback): upload a file,
 * record one, or link to one. Also removes the current one.
 */
export default function ConceptVideoModal({ open, modelId, concept, onClose }) {
  const { t } = useTranslation();
  const uploader = useConceptVideoUpload(modelId);
  const [setUrl, setUrlState] = useSetConceptVideoUrlMutation();
  const [removeVideo, removeState] = useRemoveConceptVideoMutation();
  const [file, setFile] = useState(null);
  const [url, setUrlText] = useState("");
  const [linkError, setLinkError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setUrlText("");
    setLinkError(null);
    uploader.reset();
  }, [open, concept?.concept]);

  if (!concept) return null;
  const busy = uploader.status === "uploading" || uploader.status === "processing";

  const doUpload = async () => {
    const res = await uploader.upload(concept.concept, file);
    if (res) onClose(true);
  };
  const doLink = async () => {
    setLinkError(null);
    try {
      await setUrl({ modelId, concept: concept.concept, url: url.trim() }).unwrap();
      onClose(true);
    } catch (err) {
      setLinkError(rpcErrorMessage(err));
    }
  };

  const uploadPanel = (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Upload.Dragger
        accept="video/*"
        maxCount={1}
        beforeUpload={(f) => {
          setFile(f);
          return false; // we upload ourselves, in chunks
        }}
        onRemove={() => setFile(null)}
        fileList={file ? [{ uid: "1", name: file.name, status: "done" }] : []}
        disabled={busy}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t("models.video.drop", "Click or drop a video here")}</p>
        <p className="ant-upload-hint">{t("models.video.limits", "MP4, WebM or MOV, up to 100 MB. A few seconds is best.")}</p>
      </Upload.Dragger>
    </Space>
  );

  return (
    <Modal
      open={open}
      title={t("models.video.title", "Reference video for “{{label}}”", { label: concept.label })}
      onCancel={() => (busy ? uploader.cancel() : onClose(false))}
      footer={null}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary">
        {t(
          "models.video.explain",
          "This clip is shown when someone speaks this word or phrase in the Translator. Sign it once, clearly, facing the camera."
        )}
      </Typography.Paragraph>
      {concept.videoUrl && (
        <div className="tm-block">
          <video src={concept.videoUrl} controls playsInline preload="metadata" className="tm-clip-video" />
          <Button
            danger
            size="small"
            loading={removeState.isLoading}
            onClick={async () => {
              await removeVideo({ modelId, concept: concept.concept }).unwrap().catch(() => {});
              onClose(true);
            }}
          >
            {t("models.video.remove", "Remove this video")}
          </Button>
        </div>
      )}
      <Tabs
        items={[
          {
            key: "upload",
            label: t("models.video.tabUpload", "Upload"),
            children: uploadPanel,
          },
          {
            key: "record",
            label: t("models.video.tabRecord", "Record"),
            children: <CameraClip onClip={setFile} disabled={busy} />,
          },
          {
            key: "link",
            label: t("models.video.tabLink", "Link"),
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  value={url}
                  onChange={(e) => setUrlText(e.target.value)}
                  placeholder="https://…/sign.mp4"
                  aria-label={t("models.video.linkLabel", "Link to a video file")}
                />
                {linkError && <Typography.Text type="danger">{linkError}</Typography.Text>}
                <Button type="primary" onClick={doLink} loading={setUrlState.isLoading} disabled={!/^https:\/\//.test(url.trim())}>
                  {t("models.video.useLink", "Use this link")}
                </Button>
              </Space>
            ),
          },
        ]}
      />
      {file && (
        <div className="tm-block">
          {busy && (
            <Progress
              percent={uploader.status === "processing" ? 100 : Math.round(uploader.progress * 100)}
              status={uploader.status === "processing" ? "active" : "normal"}
            />
          )}
          {uploader.status === "processing" && (
            <Typography.Text type="secondary">{t("models.video.processing", "Converting the video…")}</Typography.Text>
          )}
          {uploader.error && (
            <Alert type="error" showIcon message={uploader.error.message ? rpcErrorMessage(uploader.error) : String(uploader.error)} />
          )}
          <Space>
            <Button type="primary" onClick={doUpload} loading={busy} disabled={!file}>
              {t("models.video.save", "Save video")}
            </Button>
            {busy && <Button onClick={uploader.cancel}>{t("common.cancel", "Cancel")}</Button>}
          </Space>
        </div>
      )}
    </Modal>
  );
}

ConceptVideoModal.propTypes = {
  open: PropTypes.bool,
  modelId: PropTypes.string.isRequired,
  concept: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
