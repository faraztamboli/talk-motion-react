import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Segmented, Select, Tag } from "antd";
import { MdMic, MdMicOff, MdPerson, MdVideocam } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { hasRpc, rpc, rpcErrorMessage, sessionToken } from "../../api/rpc";
import useSpeechInput from "./useSpeechInput";
import useSignVideoQueue from "./useSignVideoQueue";
import useAvatarQueue from "./useAvatarQueue";
import { buildPlaylist } from "./playlist";
import { fetchPoses } from "./avatarPoses";
import SignVideoPlayer from "./SignVideoPlayer";
import AvatarPlayer from "./AvatarPlayer";
import { PlainLanguage } from "../../components/ui/PlainLanguage";
import { readPref, writePref } from "./prefs";

/** English -> ASL gloss (LLM on the server); a plain word split when that isn't available. */
export async function toGloss(text) {
  const fallback = String(text).toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, "")).filter(Boolean);
  if (!hasRpc("englishToGloss")) return fallback;
  try {
    const res = await rpc("englishToGloss", [sessionToken(), text], { raw: true, timeoutMs: 20000 });
    return Array.isArray(res?.gloss) && res.gloss.length ? res.gloss : fallback;
  } catch {
    return fallback;
  }
}

function StatusLine({ input, translating, playing }) {
  const { t } = useTranslation();
  let text = t("translator.voiceIdle", "Press Speak and talk. Your words are signed here.");
  let color;
  if (input.status === "starting") text = t("translator.voiceStarting", "Starting the microphone…");
  else if (input.status === "paused") {
    text = t("translator.voicePaused", "Paused while your signed sentence is spoken aloud.");
    color = "default";
  } else if (input.transcribing) {
    text = t("translator.voiceTranscribing", "Recognizing what you said…");
    color = "processing";
  } else if (translating) {
    text = t("translator.voiceTranslating", "Translating to signs…");
    color = "processing";
  } else if (input.status === "listening") {
    text = playing ? t("translator.voiceListeningPlaying", "Listening (signs are playing)…") : t("translator.voiceListening", "Listening…");
    color = "red";
  }
  return (
    <div className="tm-tr-status" role="status" aria-live="polite">
      {color ? <Tag color={color}>{text}</Tag> : <span className="tm-tr-muted">{text}</span>}
    </div>
  );
}

StatusLine.propTypes = { input: PropTypes.object, translating: PropTypes.bool, playing: PropTypes.bool };

/**
 * Speech -> sign: the microphone, what was heard, and the signs (recorded videos or the avatar).
 * `suspended` pauses the microphone while the page's text-to-speech is talking.
 */
export default function SpeechToSignPanel({ modelId, languages, onTranscript, suspended }) {
  const { t } = useTranslation();
  const [language, setLanguageState] = useState(() => readPref("language", "en-US"));
  const [mode, setModeState] = useState(() => (readPref("playback", "video") === "avatar" ? "avatar" : "video"));
  const [heard, setHeard] = useState(null); // { text, gloss }
  const [translating, setTranslating] = useState(0);
  const [missing, setMissing] = useState([]);
  const [playbackError, setPlaybackError] = useState(null);
  const lastPosesRef = useRef([]);
  const playGenerationRef = useRef(0);

  const queue = useSignVideoQueue();
  const avatar = useAvatarQueue();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;

  // Keep the language valid for this server.
  useEffect(() => {
    if (languages?.length && !languages.includes(language)) setLanguageState(languages[0]);
  }, [languages, language]);

  const stopPlayback = useCallback(() => {
    playGenerationRef.current += 1;
    queue.stop();
    avatar.stop();
  }, [queue, avatar]);

  // A different vocabulary: stop what's playing.
  useEffect(() => {
    stopPlayback();
    setMissing([]);
  }, [modelId]);

  const playGloss = useCallback(
    async (gloss) => {
      const model = modelIdRef.current;
      if (!model || !gloss.length) return;
      const generation = playGenerationRef.current;
      const cancelled = () => generation !== playGenerationRef.current;
      setPlaybackError(null);
      if (modeRef.current === "avatar") {
        const collected = [];
        setMissing([]);
        await fetchPoses(
          model,
          gloss,
          (items, miss) => {
            collected.push(...items);
            avatar.enqueue(items);
            if (miss.length) setMissing((m) => [...m, ...miss]);
          },
          cancelled
        );
        if (!cancelled()) lastPosesRef.current = collected;
        return;
      }
      const res = await rpc("translateWordsToGestures", [model, gloss, language]);
      if (cancelled()) return;
      const [dictionary, playlist] = Array.isArray(res) ? res : [{}, []];
      const built = buildPlaylist(dictionary, playlist, Date.now());
      setMissing(built.missing);
      queue.enqueue(built.items);
    },
    [avatar, language, queue]
  );

  const handleFinal = useCallback(
    async (text) => {
      const gloss = await (async () => {
        setTranslating((n) => n + 1);
        try {
          return await toGloss(text);
        } finally {
          setTranslating((n) => Math.max(0, n - 1));
        }
      })();
      setHeard({ text, gloss });
      onTranscript?.(text);
      setTranslating((n) => n + 1);
      try {
        await playGloss(gloss);
      } catch (err) {
        setPlaybackError(rpcErrorMessage(err, t("translator.playbackError", "Those words couldn't be turned into signs.")));
      } finally {
        setTranslating((n) => Math.max(0, n - 1));
      }
    },
    [onTranscript, playGloss, t]
  );

  const input = useSpeechInput({ language, onFinal: handleFinal, suspended });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    writePref("language", lang);
  };
  const setMode = (m) => {
    stopPlayback();
    setModeState(m);
    writePref("playback", m);
  };

  const replayAvatar = () => {
    avatar.stop();
    avatar.enqueue(lastPosesRef.current);
  };

  const playing = mode === "avatar" ? avatar.playing : queue.playing;
  const placeholder = modelId
    ? t("translator.signsPlaceholder", "Signs for what you say play here.")
    : t("translator.chooseModelFirst", "Choose a model above first.");

  return (
    <section className="tm-tr-panel" aria-labelledby="tm-tr-voice-title">
      <header className="tm-tr-panel-head">
        <div>
          <h2 id="tm-tr-voice-title">{t("translator.voiceTitle", "Speech to sign")}</h2>
          <p className="tm-tr-muted">{t("translator.voiceSubtitle", "Talk; what you say is shown in sign.")}</p>
        </div>
        <Segmented
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { label: t("translator.modeVideo", "Video"), value: "video", icon: <MdVideocam aria-hidden /> },
            { label: t("translator.modeAvatar", "Avatar"), value: "avatar", icon: <MdPerson aria-hidden /> },
          ]}
          aria-label={t("translator.modeAria", "Show signs as recorded videos or as the avatar")}
        />
      </header>

      {mode === "avatar" ? (
        <AvatarPlayer avatar={avatar} onReplay={replayAvatar} canReplay={lastPosesRef.current.length > 0} placeholder={placeholder} />
      ) : (
        <SignVideoPlayer queue={queue} placeholder={placeholder} />
      )}

      {missing.length > 0 && (
        <p className="tm-tr-muted" role="status">
          {t("translator.missingSigns", "No sign for: {{words}}", { words: missing.join(", ") })}
        </p>
      )}

      <div className="tm-tr-row">
        {input.listening ? (
          <Button danger onClick={input.stop} icon={<MdMicOff aria-hidden />} aria-pressed>
            {t("translator.stopListening", "Stop")}
          </Button>
        ) : (
          <Button type="primary" onClick={input.start} disabled={!modelId || !input.supported} icon={<MdMic aria-hidden />} aria-pressed={false}>
            {t("translator.speak", "Speak")}
          </Button>
        )}
        {languages?.length > 1 && (
          <label className="tm-tr-field">
            <span>{t("translator.language", "Language")}</span>
            <Select
              size="small"
              value={language}
              onChange={setLanguage}
              options={languages.map((l) => ({ value: l, label: l }))}
              aria-label={t("translator.language", "Language")}
            />
          </label>
        )}
        {input.engine && (
          <Tag bordered={false}>
            {input.engine === "whisper" ? t("translator.engineServer", "Server recognition") : t("translator.engineBrowser", "Browser recognition")}
          </Tag>
        )}
      </div>

      <StatusLine input={input} translating={translating > 0} playing={playing} />

      {!input.supported && (
        <Alert
          type="info"
          showIcon
          className="tm-tr-alert"
          message={t("translator.noSpeechInput", "This browser can't listen. Use Chrome, Edge or Safari to speak to the translator.")}
        />
      )}
      {input.error && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={input.dismissError}
          className="tm-tr-alert"
          message={input.error}
          action={
            <Button size="small" onClick={input.start}>
              {t("translator.tryAgain", "Try again")}
            </Button>
          }
        />
      )}
      {input.notice && <Alert type="info" showIcon closable onClose={input.dismissNotice} className="tm-tr-alert" message={input.notice} />}
      {playbackError && (
        <Alert type="warning" showIcon closable onClose={() => setPlaybackError(null)} className="tm-tr-alert" message={playbackError} />
      )}

      <div className="tm-tr-output" aria-live="polite">
        {input.interim && <p className="tm-tr-interim">{input.interim}</p>}
        {heard ? (
          <>
            <p className="tm-tr-output-label">{t("translator.youSaid", "You said")}</p>
            <p className="tm-tr-output-text">{heard.text}</p>
            <p className="tm-tr-muted">
              {t("translator.signs", "Signs")}: {heard.gloss.join(" ")}
            </p>
            <PlainLanguage text={heard.text} />
          </>
        ) : (
          !input.interim && <p className="tm-tr-muted">{t("translator.heardEmpty", "What you say appears here.")}</p>
        )}
      </div>
    </section>
  );
}

SpeechToSignPanel.propTypes = {
  modelId: PropTypes.string,
  languages: PropTypes.arrayOf(PropTypes.string),
  onTranscript: PropTypes.func,
  suspended: PropTypes.bool,
};
