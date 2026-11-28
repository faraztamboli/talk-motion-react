import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Space, Tag, Typography } from "antd";
import { CloseOutlined, EditOutlined, SoundOutlined, UndoOutlined } from "@ant-design/icons";
import { MdSend, MdVideocam, MdVideocamOff } from "react-icons/md";
import { useTranslation } from "react-i18next";
import LandmarkerView from "../landmarks/LandmarkerView";
import useLandmarker from "../landmarks/useLandmarker";
import ModelPicker from "../models/ModelPicker";
import SentenceChips from "./SentenceChips";
import useSignRecognizer from "./useSignRecognizer";
import { CONFIDENCE_FIRM } from "./sentence";
import "./signInput.css";

const MODEL_KEY = "tm_conv_sign_model";

function readModel() {
  try {
    return globalThis.localStorage?.getItem(MODEL_KEY) || null;
  } catch {
    return null;
  }
}

function writeModel(id) {
  try {
    if (id) globalThis.localStorage?.setItem(MODEL_KEY, String(id));
  } catch {
    // remembered for this visit only
  }
}

/**
 * Sign to the camera; the recognized sentence becomes a draft the signer confirms.
 *
 * Nothing is spoken from here without a tap. Every way out of a draft is reported with the same
 * draft object, so acceptance can be measured (doc 13, M0):
 *   onSpeak({ text, draft })  Speak, or "Use my signs as they are" (counted as an edit)
 *   onEdit(draft)             move the draft into the text box to change it first
 *   onReject(draft)           Not this
 * draft: { text, draftId, modality: "sign", modelVersion, confidence, recognizeMs, englishMs, shownAt }
 *
 * toEnglish(gloss) turns recognized signs into English (see useSignRecognizer).
 */
export default function SignDraftTray({ toEnglish, onSpeak, onEdit, onReject, onClose, disabled = false, signedIn = true }) {
  const { t } = useTranslation();
  const [modelId, setModelIdState] = useState(readModel);
  const [modelInfo, setModelInfo] = useState(null);
  const [draft, setDraft] = useState(null); // { text, gloss, meta, shownAt }
  const draftRef = useRef(null);
  draftRef.current = draft;

  const setModelId = useCallback((id) => {
    setModelIdState(id);
    writeModel(id);
  }, []);

  const onSentence = useCallback((text, gloss, meta) => {
    setDraft({ text, gloss, meta: meta || {}, shownAt: Date.now() });
  }, []);

  const rec = useSignRecognizer({ modelId, autoSend: true, onSentence, toEnglish });
  const lm = useLandmarker({ onFrame: rec.onFrame, fullFace: rec.fullFace });
  const { stop: stopCamera } = lm;
  const { reset: resetSentence } = rec;

  // Leaving the tray turns the camera off.
  useEffect(
    () => () => {
      stopCamera();
      resetSentence();
    },
    [stopCamera, resetSentence]
  );

  const draftOut = (d) => ({
    text: d.text,
    draftId: d.meta.draftId || null,
    modality: "sign",
    modelVersion: d.meta.modelVersion || null,
    confidence: typeof d.meta.confidence === "number" ? d.meta.confidence : null,
    recognizeMs: d.meta.recognizeMs ?? null,
    englishMs: d.meta.englishMs ?? null,
    shownAt: d.shownAt,
  });

  const speak = (text) => {
    const d = draftRef.current;
    if (!d || disabled) return;
    onSpeak({ text, draft: draftOut(d) });
    setDraft(null);
  };

  const edit = () => {
    const d = draftRef.current;
    if (!d) return;
    onEdit(draftOut(d));
    setDraft(null);
  };

  const reject = () => {
    const d = draftRef.current;
    if (!d) return;
    onReject(draftOut(d));
    setDraft(null);
  };

  const untrained = modelInfo?.trained === false;
  const cameraOn = lm.isActive;
  const canSend = rec.words.length > 0 || rec.pendingCount > 0 || rec.signing;
  const glossText = draft ? draft.gloss.join(" ") : "";
  const unsure = draft && typeof draft.meta.confidence === "number" && draft.meta.confidence < CONFIDENCE_FIRM;

  return (
    <section className="tm-si-tray" aria-label={t("signInput.title", "Sign to speak")}>
      <div className="tm-si-head">
        <Typography.Text strong>{t("signInput.title", "Sign to speak")}</Typography.Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          aria-label={t("signInput.close", "Close signing")}
        />
      </div>

      {!signedIn ? (
        <Typography.Text type="secondary">
          {t(
            "signInput.needsModels",
            "Signing uses your TalkMotion sign models, and this account has none linked. Type instead, or sign in with the account that has your models."
          )}
        </Typography.Text>
      ) : (
        <>
          <div className="tm-si-row">
            <ModelPicker scope="usable" value={modelId} onChange={setModelId} onResolve={setModelInfo} size="middle" />
            {cameraOn ? (
              <Button
                onClick={() => {
                  lm.stop();
                  rec.reset();
                }}
                icon={<MdVideocamOff aria-hidden />}
              >
                {t("signInput.stopCamera", "Stop camera")}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => lm.start()}
                disabled={!modelId || untrained}
                icon={<MdVideocam aria-hidden />}
              >
                {t("signInput.startCamera", "Start camera")}
              </Button>
            )}
          </div>

          <LandmarkerView
            lm={lm}
            className="tm-si-camera"
            showStartButton={false}
            showDevicePicker={false}
            idleTitle={t("signInput.cameraOff", "Camera is off")}
            idleHint={
              untrained
                ? t("signInput.untrained", "This model isn't trained yet. Choose a trained model.")
                : t("signInput.cameraOffHint", "Start the camera and sign. Lower your hands when you finish.")
            }
            overlay={
              rec.signing ? (
                <span className="tm-tr-live-badge" role="status">
                  {t("translator.signing", "Signing…")}
                </span>
              ) : null
            }
          />

          <SentenceChips
            words={rec.words}
            pendingCount={rec.pendingCount}
            onChoose={rec.choose}
            onRemove={rec.remove}
            onConfirm={rec.confirm}
            placeholder={
              cameraOn
                ? t("signInput.sentenceEmpty", "Your signs appear here.")
                : t("signInput.sentenceOff", "Start the camera to sign.")
            }
          />

          <div className="tm-si-row">
            <Button onClick={rec.send} disabled={!canSend || rec.sending} loading={rec.sending} icon={<MdSend aria-hidden />}>
              {t("signInput.done", "Done signing")}
            </Button>
            <Button onClick={rec.undo} disabled={!rec.words.length} icon={<UndoOutlined aria-hidden />}>
              {t("translator.undo", "Undo")}
            </Button>
            <Button onClick={rec.clear} disabled={!rec.words.length && !rec.pendingCount}>
              {t("translator.clear", "Clear")}
            </Button>
          </div>

          {rec.error && (
            <Alert type="warning" showIcon closable onClose={rec.dismissError} message={rec.error} />
          )}
        </>
      )}

      <div className="tm-si-draft" aria-live="polite">
        {draft && (
          <>
            <div className="tm-si-draft-head">
              <Typography.Text type="secondary">{t("signInput.draftLabel", "Ready to say")}</Typography.Text>
              {unsure && <Tag color="gold">{t("signInput.unsure", "Not sure; check before speaking")}</Tag>}
            </div>
            <p className="tm-si-draft-text">{draft.text}</p>
            {glossText.toLowerCase() !== draft.text.toLowerCase() && (
              <Typography.Text type="secondary" className="tm-si-gloss">
                {t("signInput.yourSigns", "Your signs")}: {glossText}
              </Typography.Text>
            )}
            <Space wrap>
              <Button type="primary" size="large" icon={<SoundOutlined />} onClick={() => speak(draft.text)} disabled={disabled}>
                {t("conversation.speak", "Speak")}
              </Button>
              <Button size="large" icon={<EditOutlined />} onClick={edit}>
                {t("signInput.edit", "Edit")}
              </Button>
              <Button size="large" onClick={reject}>
                {t("signInput.notThis", "Not this")}
              </Button>
              {glossText.toLowerCase() !== draft.text.toLowerCase() && (
                <Button type="link" onClick={() => speak(glossText)} disabled={disabled}>
                  {t("signInput.useSigns", "Say my signs as they are")}
                </Button>
              )}
            </Space>
          </>
        )}
      </div>
    </section>
  );
}

SignDraftTray.propTypes = {
  toEnglish: PropTypes.func,
  onSpeak: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  signedIn: PropTypes.bool,
};
