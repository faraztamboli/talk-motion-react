import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Popover, Slider, Space, Switch, Tag, Tooltip } from "antd";
import { SettingOutlined, UndoOutlined } from "@ant-design/icons";
import { MdSend, MdVideocam, MdVideocamOff } from "react-icons/md";
import { useTranslation } from "react-i18next";
import LandmarkerView from "../landmarks/LandmarkerView";
import useLandmarker from "../landmarks/useLandmarker";
import useSignRecognizer from "./useSignRecognizer";
import SentenceChips from "./SentenceChips";
import VoiceControls from "./VoiceControls";
import SpeakDraft from "../../components/ui/SpeakDraft";
import { PlainLanguage } from "../../components/ui/PlainLanguage";
import { readPref, writePref } from "./prefs";

const MISS_VISIBLE_MS = 3000;

function RecognitionTag({ mode }) {
  const { t } = useTranslation();
  if (mode === "ready") return <Tag color="green">{t("translator.onDevice", "Recognizing on this device")}</Tag>;
  if (mode === "loading" || mode === "checking")
    return <Tag>{t("translator.loadingModel", "Preparing recognition…")}</Tag>;
  if (mode === "server") return <Tag color="blue">{t("translator.onServer", "Recognizing on the server")}</Tag>;
  return null;
}

RecognitionTag.propTypes = { mode: PropTypes.string };

/**
 * Sign -> speech: camera, live sentence with Send / Undo / Clear, and the spoken result.
 * `speech` is the page's useSpeechOutput, `speakDraft` its useConfirmToSpeak (nothing is spoken
 * for the signer until they tap Speak, unless they turned on "Speak automatically").
 */
export default function SignToSpeechPanel({ modelId, speech, speakDraft, onSentence }) {
  const { t } = useTranslation();
  const [autoSend, setAutoSendState] = useState(() => readPref("autoSend", true));
  const [idleMs, setIdleMsState] = useState(() => readPref("idleMs", 1500));
  const [lastSentence, setLastSentence] = useState(null);
  const [now, setNow] = useState(Date.now());

  const handleSentence = useCallback(
    (text, gloss) => {
      setLastSentence({ text, gloss, at: Date.now() });
      onSentence?.(text, gloss);
    },
    [onSentence]
  );

  const rec = useSignRecognizer({ modelId, autoSend, idleMs, onSentence: handleSentence });
  const lm = useLandmarker({ onFrame: rec.onFrame });

  // Show "didn't catch that" for a few seconds after a miss.
  useEffect(() => {
    if (!rec.lastMiss) return undefined;
    setNow(Date.now());
    const id = setTimeout(() => setNow(Date.now()), MISS_VISIBLE_MS + 50);
    return () => clearTimeout(id);
  }, [rec.lastMiss]);
  const showMiss = rec.lastMiss && now - rec.lastMiss.at < MISS_VISIBLE_MS;

  // Stopping the camera also drops the half-made sentence.
  const stopCamera = () => {
    lm.stop();
    rec.reset();
  };

  const setAutoSend = (on) => {
    setAutoSendState(on);
    writePref("autoSend", on);
  };
  const setIdleMs = (ms) => {
    setIdleMsState(ms);
    writePref("idleMs", ms);
  };

  const seconds = (idleMs / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const settings = (
    <div className="tm-tr-settings">
      <label className="tm-tr-setting-row">
        <Switch checked={autoSend} onChange={setAutoSend} size="small" aria-label={t("translator.autoSend", "Send when I lower my hands")} />
        <span>{t("translator.autoSend", "Send when I lower my hands")}</span>
      </label>
      <label className="tm-tr-setting-col">
        <span>
          {t("translator.idleLabel", "Hands down for {{seconds}} s", { seconds })}
        </span>
        <Slider
          min={800}
          max={4000}
          step={100}
          value={idleMs}
          onChange={setIdleMs}
          disabled={!autoSend}
          tooltip={{ formatter: (v) => `${(v / 1000).toFixed(1)} s` }}
          aria-label={t("translator.idleAria", "How long hands must be down before sending")}
          aria-valuetext={`${seconds} s`}
        />
      </label>
    </div>
  );

  const cameraOn = lm.isActive;
  const canSend = rec.words.length > 0 || rec.pendingCount > 0 || rec.signing;

  return (
    <section className="tm-tr-panel" aria-labelledby="tm-tr-sign-title">
      <header className="tm-tr-panel-head">
        <div>
          <h2 id="tm-tr-sign-title">{t("translator.signTitle", "Sign to speech")}</h2>
          <p className="tm-tr-muted">{t("translator.signSubtitle", "Sign to the camera; your sentence is spoken aloud.")}</p>
        </div>
        <RecognitionTag mode={rec.recognitionMode} />
      </header>

      <LandmarkerView
        lm={lm}
        idleTitle={t("translator.cameraOffTitle", "Camera is off")}
        idleHint={
          modelId
            ? t("translator.cameraOffHint", "Turn the camera on and start signing.")
            : t("translator.chooseModelFirst", "Choose a model above first.")
        }
        showStartButton={Boolean(modelId)}
        overlay={
          rec.signing ? (
            <span className="tm-tr-live-badge" role="status">
              {t("translator.signing", "Signing…")}
            </span>
          ) : null
        }
      />

      <div className="tm-tr-row">
        {cameraOn ? (
          <Button onClick={stopCamera} icon={<MdVideocamOff aria-hidden />}>
            {t("translator.stopCamera", "Stop camera")}
          </Button>
        ) : (
          <Button type="primary" onClick={() => lm.start()} disabled={!modelId} icon={<MdVideocam aria-hidden />}>
            {t("translator.startCamera", "Start camera")}
          </Button>
        )}
        <Popover content={settings} trigger="click" title={t("translator.sentenceSettings", "Sentence settings")}>
          <Button icon={<SettingOutlined aria-hidden />} aria-label={t("translator.sentenceSettings", "Sentence settings")}>
            {t("translator.settings", "Settings")}
          </Button>
        </Popover>
      </div>

      <SentenceChips
        words={rec.words}
        pendingCount={rec.pendingCount}
        onChoose={rec.choose}
        onRemove={rec.remove}
        onConfirm={rec.confirm}
        placeholder={
          cameraOn ? t("translator.sentenceEmpty", "Recognized signs appear here.") : t("translator.sentenceOff", "Start the camera to sign.")
        }
      />
      {showMiss && (
        <p className="tm-tr-muted" role="status">
          {t("translator.miss", "That sign wasn't clear. Try it again.")}
        </p>
      )}

      <div className="tm-tr-row">
        <Button type="primary" onClick={rec.send} disabled={!canSend || rec.sending} loading={rec.sending} icon={<MdSend aria-hidden />}>
          {t("translator.send", "Send")}
        </Button>
        <Tooltip title={t("translator.undoTip", "Remove the last word")}>
          <Button onClick={rec.undo} disabled={!rec.words.length} icon={<UndoOutlined aria-hidden />}>
            {t("translator.undo", "Undo")}
          </Button>
        </Tooltip>
        <Button onClick={rec.clear} disabled={!rec.words.length && !rec.pendingCount}>
          {t("translator.clear", "Clear")}
        </Button>
      </div>
      <p className="tm-tr-hint">
        {autoSend
          ? t("translator.autoHint", "Lower your hands for {{seconds}} s to send, or tap Send.", { seconds })
          : t("translator.manualHint", "Tap Send when your sentence is complete.")}
      </p>

      {rec.error && (
        <Alert
          type="warning"
          showIcon
          closable
          onClose={rec.dismissError}
          message={rec.error}
          className="tm-tr-alert"
        />
      )}

      <div className="tm-tr-output" aria-live="polite">
        {lastSentence ? (
          <>
            <p className="tm-tr-output-label">{t("translator.youSigned", "You signed")}</p>
            <p className="tm-tr-output-text">{lastSentence.text}</p>
            {lastSentence.gloss.join(" ").toLowerCase() !== lastSentence.text.toLowerCase() && (
              <p className="tm-tr-muted">
                {t("translator.signs", "Signs")}: {lastSentence.gloss.join(" ")}
              </p>
            )}
            <PlainLanguage text={lastSentence.text} />
          </>
        ) : (
          <p className="tm-tr-muted">{t("translator.outputEmpty", "Your signed sentences appear here and are spoken aloud.")}</p>
        )}
        <SpeakDraft {...speakDraft} volume={speech.volume} />
      </div>

      <Space direction="vertical" className="tm-tr-voice-wrap">
        <VoiceControls speech={speech} />
      </Space>
    </section>
  );
}

SignToSpeechPanel.propTypes = {
  modelId: PropTypes.string,
  speech: PropTypes.object.isRequired,
  speakDraft: PropTypes.object.isRequired,
  onSentence: PropTypes.func,
};
