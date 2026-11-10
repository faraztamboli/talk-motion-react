import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, ConfigProvider, Popover, Spin, Typography } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import MetaDecorator from "../../components/MetaDecorator";
import ErrorBoundary from "../../components/ErrorBoundary";
import ModelPicker from "../models/ModelPicker";
import { useListModelsQuery } from "../models/modelsApi";
import { useFlag } from "../../hooks/useFlag";
import { hasRpc, rpc } from "../../api/rpc";
import { addConversationEntry } from "../../app/features/conversationSlice";
import useConfirmToSpeak from "../../hooks/useConfirmToSpeak";
import useSpeechOutput from "./useSpeechOutput";
import SignToSpeechPanel from "./SignToSpeechPanel";
import SpeechToSignPanel from "./SpeechToSignPanel";
import TranscriptPanel from "./TranscriptPanel";
import { readPref, writePref } from "./prefs";
import "./translator.css";

// Darker primary and danger colours so white button text meets WCAG AA (4.5:1).
const THEME = { token: { colorPrimary: "#0b57d0", colorLink: "#0b57d0", colorError: "#b42318" } };

/** Languages the server can translate; ["en-US"] when it doesn't say. */
function useServerLanguages() {
  const [languages, setLanguages] = useState(["en-US"]);
  useEffect(() => {
    if (!hasRpc("languagesSupported")) return undefined;
    let cancelled = false;
    rpc("languagesSupported", [], { raw: true })
      .then((res) => {
        const list = res && typeof res === "object" && !Array.isArray(res) ? Object.keys(res) : [];
        if (!cancelled && list.length) setLanguages(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return languages;
}

/** With the model catalogue hidden (legacy_models_visible off): pick the first usable model. */
function AutoVocabulary({ value, onChange }) {
  const { t } = useTranslation();
  const { data, isLoading } = useListModelsQuery({ scope: "usable", search: "", offset: 0, limit: 50, sort: "recent" });
  const rows = data?.rows || [];
  const selected = rows.find((m) => m.id === value);
  useEffect(() => {
    if (isLoading || selected) return;
    const first = rows.find((m) => m.trained !== false);
    if (first) onChange(first.id);
  }, [isLoading, onChange, rows, selected]);
  if (isLoading) return <Spin size="small" />;
  if (!selected) {
    return <Typography.Text type="secondary">{t("translator.noVocabulary", "No sign vocabulary is available for your account yet.")}</Typography.Text>;
  }
  return (
    <Typography.Text>
      {t("translator.vocabulary", "Vocabulary")}: <strong>{selected.title}</strong>
    </Typography.Text>
  );
}

AutoVocabulary.propTypes = { value: PropTypes.string, onChange: PropTypes.func.isRequired };

function HowItWorks() {
  const { t } = useTranslation();
  return (
    <ol className="tm-tr-help">
      <li>{t("translator.help1", "Choose the model (the vocabulary of signs) to translate with.")}</li>
      <li>{t("translator.help2", "Sign to speech: start the camera and sign. Each sign appears as a word; tap a word to change or remove it.")}</li>
      <li>{t("translator.help3", "Lower your hands, or tap Send, and the sentence is ready to speak. Tap Speak, or turn on Speak automatically.")}</li>
      <li>{t("translator.help4", "Speech to sign: press Speak and talk. Your words are shown as sign videos or by the avatar.")}</li>
      <li>{t("translator.help5", "While a sentence is spoken aloud the microphone pauses, so the translator doesn't hear itself.")}</li>
    </ol>
  );
}

/** The Translator (/converter): sign to speech and speech to sign, side by side. */
export default function TranslatorPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const catalogueVisible = useFlag("legacy_models_visible");
  // A link such as "Try it in the Translator" (/converter?model=7) picks the model; otherwise the
  // last one used on this device.
  const [params] = useSearchParams();
  const [modelId, setModelIdState] = useState(() => {
    const fromLink = params.get("model");
    if (fromLink) writePref("model", fromLink);
    return fromLink || readPref("model", null);
  });
  const languages = useServerLanguages();
  const speech = useSpeechOutput({ lang: languages[0] || "en-US" });
  const speakDraft = useConfirmToSpeak(speech.speak);

  const setModelId = useCallback((id) => {
    setModelIdState(id ? String(id) : null);
    writePref("model", id ? String(id) : null);
  }, []);

  const onSentence = useCallback(
    (text) => {
      dispatch(addConversationEntry({ source: "sign", text }));
      speakDraft.offer(text, speech.volume);
    },
    [dispatch, speakDraft, speech.volume]
  );
  const onTranscript = useCallback((text) => dispatch(addConversationEntry({ source: "voice", text })), [dispatch]);

  return (
    <ConfigProvider theme={THEME}>
      <MetaDecorator title="TalkMotion | Translator" description="Translate between sign language and speech, both ways." />
      <div className="tm-tr-page" role="region" aria-labelledby="tm-tr-title">
        <header className="tm-tr-header">
          <div>
            <h1 id="tm-tr-title">{t("translator.title", "Translator")}</h1>
            <p className="tm-tr-muted">{t("translator.subtitle", "Sign to speech and speech to sign, in real time.")}</p>
          </div>
          <div className="tm-tr-header-tools">
            <label className="tm-tr-field" htmlFor="tm-tr-model">
              <span>{t("translator.model", "Model")}</span>
              {catalogueVisible ? (
                <ModelPicker id="tm-tr-model" scope="usable" value={modelId} onChange={setModelId} />
              ) : (
                <AutoVocabulary value={modelId} onChange={setModelId} />
              )}
            </label>
            <Popover content={<HowItWorks />} title={t("translator.howTitle", "How the Translator works")} trigger="click" placement="bottomRight">
              <Button icon={<QuestionCircleOutlined aria-hidden />}>{t("translator.help", "How it works")}</Button>
            </Popover>
          </div>
        </header>

        <div className="tm-tr-grid">
          <ErrorBoundary compact title={t("translator.panelFailed", "This panel stopped working.")}>
            <SignToSpeechPanel modelId={modelId} speech={speech} speakDraft={speakDraft} onSentence={onSentence} />
          </ErrorBoundary>
          <ErrorBoundary compact title={t("translator.panelFailed", "This panel stopped working.")}>
            <SpeechToSignPanel modelId={modelId} languages={languages} onTranscript={onTranscript} suspended={speech.speaking} />
          </ErrorBoundary>
        </div>

        <ErrorBoundary compact>
          <TranscriptPanel />
        </ErrorBoundary>
      </div>
    </ConfigProvider>
  );
}
