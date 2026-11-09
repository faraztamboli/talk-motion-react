import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Result, Segmented, Space, Switch, Typography, message } from "antd";
import { AudioMutedOutlined, AudioOutlined, DownloadOutlined, ShareAltOutlined, StopOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CaptionStream from "./CaptionStream";
import ComposeTray from "./ComposeTray";
import ShareCodeModal from "./ShareCodeModal";
import LessonPanel from "./LessonPanel";
import InterpreterNotice, { INTERPRETER_REQUEST_TEXT } from "./InterpreterNotice";
import { ConnectionBanner, ParticipantsBar, TurnIndicator } from "./StatusParts";
import useConversationSocket from "../hooks/useConversationSocket";
import useBrowserASR from "../hooks/useBrowserASR";
import useMicStream, { micStreamSupported } from "../hooks/useMicStream";
import useTTSPlayer from "../hooks/useTTSPlayer";
import useVoices from "../hooks/useVoices";
import { dispatchEnvelope, newId } from "../protocol";
import { endConversation, fetchTranscript, listUtterances, shareConversation, transcriptToText } from "../api";
import {
  conversationOpened,
  errorCleared,
  socketChanged,
  speakingEnded,
  speakingStarted,
  suggestionsCleared,
  utterancesLoaded,
} from "../state/conversationV2Slice";
import "../conversation.css";

const TEXT_SIZE_KEY = "tm_conv_text_size";

// Server errors after which this device recognises speech itself for the rest of the visit.
const SERVER_ASR_FALLBACK_CODES = new Set([
  "asr_unavailable",
  "asr_stalled",
  "asr_disconnected",
  "asr_not_server_side",
]);

function readTextSize() {
  try {
    return localStorage.getItem(TEXT_SIZE_KEY) || null;
  } catch {
    return null;
  }
}

function speechLang(spoken) {
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  if (!spoken) return nav || "en-US";
  return nav && nav.toLowerCase().startsWith(spoken.toLowerCase()) ? nav : spoken;
}

/**
 * A live conversation for one participant (signed-in owner or guest who joined by code).
 *
 * @param {string} conversationId
 * @param {() => string} getToken   access token, or the guest's participant token
 * @param {boolean} guest
 * @param {{joinCode?: string, expiresAt?: string}} initialShare  show the code right away
 */
export default function ConversationView({ conversationId, getToken, guest = false, initialShare = null }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const conv = useSelector((state) => state.conversationV2);
  const [listen, setListen] = useState(false);
  const [chosenSize, setChosenSize] = useState(readTextSize);
  const [plainChoice, setPlainChoice] = useState(null);
  const [share, setShare] = useState(initialShare?.joinCode ? initialShare : null);
  const [serverAsrFailed, setServerAsrFailed] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const sendRef = useRef(() => false);
  const lastIdRef = useRef(0);
  const partialIdRef = useRef(newId());

  useEffect(() => {
    dispatch(conversationOpened(conversationId));
  }, [conversationId, dispatch]);

  useEffect(() => {
    lastIdRef.current = conv.utterances.length ? conv.utterances[conv.utterances.length - 1].id : 0;
  }, [conv.utterances]);

  const lang = speechLang(conv.info?.spoken_language);
  // Private mode (pharmacy and clinic locations): nothing said leaves TalkMotion's servers
  // and these phones. No browser recognizer, and only the phone's own on-device voice.
  const isPrivate = Boolean(conv.info?.settings?.private);
  const graceMinutes = conv.info?.words_grace_minutes;

  const player = useTTSPlayer({
    lang,
    localVoiceOnly: isPrivate,
    onStart: (item) => dispatch(speakingStarted(item)),
    onEnd: () => dispatch(speakingEnded()),
  });

  const onMessage = useCallback(
    (msg) => {
      if (msg.type === "speak.start") player.begin(msg.payload);
      else if (msg.type === "speak.done") player.end(msg.payload);
      else if (msg.type === "speak.fallback") player.speakText(msg.payload);
      else if (msg.type === "audio.ready") setAudioReady(true);
      else {
        if (msg.type === "error" && SERVER_ASR_FALLBACK_CODES.has(msg.payload?.code)) {
          setServerAsrFailed(true);
          setAudioReady(false);
        }
        dispatchEnvelope(dispatch, msg);
      }
    },
    [dispatch, player]
  );

  const onOpen = useCallback(() => {
    sendRef.current("hello", {
      client: "talk-motion-react",
      caps: {
        browser_asr: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
        mic_stream: micStreamSupported(),
      },
    });
    // Catch up on anything said while we were disconnected.
    listUtterances(conversationId, { afterId: lastIdRef.current, token: guest ? getToken() : undefined })
      .then((res) => dispatch(utterancesLoaded(res.items)))
      .catch(() => {});
  }, [conversationId, dispatch, getToken, guest]);

  const { status, send, sendBinary } = useConversationSocket({
    conversationId,
    getToken,
    canRefresh: !guest,
    enabled: !conv.ended,
    onMessage,
    onBinary: player.chunk,
    onStatus: (next) => dispatch(socketChanged(next)),
    onOpen,
  });
  sendRef.current = send;

  // Server-side recognition (e.g. self-hosted Kyutai): stream the microphone as PCM16 frames.
  // If the server can't recognise speech, fall back to the browser's own recognition.
  const serverAsr = conv.asrServerSide && !serverAsrFailed && micStreamSupported();
  const wantMic = listen && !conv.ended && serverAsr;
  const streaming = wantMic && status === "open";

  useEffect(() => {
    if (!streaming) return undefined;
    sendRef.current("audio.start", { sample_rate: 16000 });
    return () => {
      setAudioReady(false);
      sendRef.current("audio.stop");
    };
  }, [streaming]);

  const mic = useMicStream({
    enabled: wantMic,
    onFrame: (frame) => {
      if (audioReady) sendBinary(frame);
    },
  });

  const asr = useBrowserASR({
    enabled: listen && !conv.ended && !serverAsr && !isPrivate,
    lang,
    onPartial: (text) => send("caption.external", { text, is_final: false, partial_id: partialIdRef.current }),
    onFinal: (text, confidence) => {
      send("caption.external", { text, is_final: true, confidence, partial_id: partialIdRef.current });
      partialIdRef.current = newId();
    },
  });

  const voices = useVoices(conv.ttsProvider);

  const onSpeak = ({ text, draft }) => {
    player.unlock(); // inside the tap, so mobile browsers allow the audio that follows
    send("speak.confirm", {
      text,
      modality: draft ? "llm_suggestion" : "typed",
      draft_text: draft?.text,
      draft_id: draft?.draftId,
      ...(voices.voiceId ? { voice: { provider_voice_id: voices.voiceId } } : {}),
    });
    dispatch(suggestionsCleared());
  };

  const onReject = ({ text, draftId }) => {
    send("speak.reject", { draft_text: text, modality: "llm_suggestion", draft_id: draftId });
    dispatch(suggestionsCleared());
  };

  const onShare = async () => {
    try {
      const res = await shareConversation(conversationId);
      setShare({ joinCode: res.join_code, expiresAt: res.join_code_expires_at });
    } catch (err) {
      message.error(err.message);
    }
  };

  const onEnd = async () => {
    try {
      await endConversation(conversationId);
    } catch (err) {
      message.error(err.message);
    }
  };

  const onDownload = async () => {
    try {
      const res = await fetchTranscript(conversationId, { token: guest ? getToken() : undefined });
      if (res.words_deleted) {
        message.info(t("conversation.wordsDeleted", "The words of this conversation have been deleted."));
        return;
      }
      const blob = new Blob([transcriptToText(res.cues)], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err.message);
    }
  };

  const changeTextSize = (size) => {
    setChosenSize(size);
    try {
      localStorage.setItem(TEXT_SIZE_KEY, size);
    } catch {
      // ignore
    }
  };

  const meId = conv.me?.participantId;
  const others = useMemo(
    () => Object.values(conv.participants).filter((p) => p.participantId !== meId),
    [conv.participants, meId]
  );
  const talkingNames = others.filter((p) => conv.partials[p.participantId]).map((p) => p.displayName);
  const typingNames = others.filter((p) => conv.typing[p.participantId]).map((p) => p.displayName);
  const settings = conv.info?.settings || {};
  const isLesson = settings.kind === "lesson";
  const isTeacher = isLesson && Boolean(conv.me?.isOwner);
  const isStudent = isLesson && !conv.me?.isOwner;
  // Students read from a distance: larger captions unless they chose otherwise.
  const textSize = chosenSize || (isStudent ? "l" : "m");
  const showPlain = plainChoice ?? Boolean(settings.plain_language);

  if (conv.ended) {
    return (
      <div className={`conv-root${guest ? " conv-guest" : ""}`}>
        <Result
          status="success"
          title={t("conversation.endedTitle", "This conversation has ended")}
          subTitle={
            isPrivate
              ? t("conversation.privateEnded", {
                  defaultValue:
                    "Private mode: save a copy now if you want one. The words of this conversation are deleted {{n}} minutes after it ends.",
                  n: graceMinutes ?? 15,
                })
              : undefined
          }
          extra={[
            <Button key="dl" icon={<DownloadOutlined />} onClick={onDownload}>
              {t("conversation.download", "Save transcript")}
            </Button>,
            !guest && (
              <Link key="new" to="/conversation">
                <Button type="primary">{t("conversation.startAnother", "Start another conversation")}</Button>
              </Link>
            ),
          ]}
        />
      </div>
    );
  }

  return (
    <div
      className={`conv-root${guest ? " conv-guest" : ""}${isStudent ? " conv-lesson-readonly" : ""}`}
      data-text-size={textSize}
    >
      <div className="conv-header">
        <ParticipantsBar participants={conv.participants} meId={meId} />
        <Space wrap>
          <a
            href="https://talk-motion.com/feedback?from=conversation"
            target="_blank"
            rel="noreferrer"
            className="conv-report"
          >
            {t("conversation.report", "Report a problem")}
          </a>
          <Segmented
            value={textSize}
            onChange={changeTextSize}
            options={[
              { label: "A", value: "s" },
              { label: "A+", value: "m" },
              { label: "A++", value: "l" },
              { label: "A+++", value: "xl" },
            ]}
            aria-label={t("conversation.textSize", "Text size")}
          />
          {isStudent && (
            <Space>
              <Switch checked={showPlain} onChange={setPlainChoice} aria-label={t("lesson.plain", "Plain language")} />
              <Typography.Text>{t("lesson.plain", "Plain language")}</Typography.Text>
            </Space>
          )}
          {conv.me?.isOwner && (
            <>
              {!isLesson && (
                <Button icon={<ShareAltOutlined />} onClick={onShare}>
                  {t("conversation.share", "Add a phone")}
                </Button>
              )}
              <Button danger icon={<StopOutlined />} onClick={onEnd}>
                {isLesson ? t("lesson.end", "End lesson") : t("conversation.end", "End")}
              </Button>
            </>
          )}
        </Space>
      </div>

      <ConnectionBanner status={status} ended={conv.ended} />
      {isPrivate && (
        <div className="conv-private-line" role="note">
          {t("conversation.privateNote", {
            defaultValue:
              "Private mode: what is said stays on TalkMotion's servers and these phones. Its words are deleted {{n}} minutes after the conversation ends.",
            n: graceMinutes ?? 15,
          })}
        </div>
      )}
      {!isLesson && (
        <InterpreterNotice
          onAsk={() =>
            setPrefill({
              text: t("conversation.interpreterRequest", INTERPRETER_REQUEST_TEXT),
              nonce: Date.now(),
            })
          }
        />
      )}
      {conv.error && (
        <Alert
          type="warning"
          showIcon
          closable
          onClose={() => dispatch(errorCleared())}
          message={conv.error.message || conv.error.code}
        />
      )}

      {isTeacher && <LessonPanel conversationId={conversationId} initialShare={initialShare} />}

      <CaptionStream
        utterances={conv.utterances}
        partials={conv.partials}
        participants={conv.participants}
        meId={meId}
        showPlain={showPlain}
        showGloss={Boolean(settings.gloss_track)}
        tapWords={!guest}
        device={{
          role: conv.me?.role,
          isOwner: Boolean(conv.me?.isOwner),
          mode: conv.info?.mode,
          partnerLabel: settings.partner_label,
        }}
      />

      <TurnIndicator
        speaking={conv.speaking}
        talkingNames={talkingNames}
        typingNames={typingNames}
        listening={serverAsr ? mic.active : asr.listening}
      />

      {!isStudent && (
      <div className="conv-tray-row">
        {serverAsr || (asr.supported && !isPrivate) ? (
          <Space align="center">
            <Switch
              checked={listen}
              onChange={setListen}
              checkedChildren={<AudioOutlined />}
              unCheckedChildren={<AudioMutedOutlined />}
              aria-label={t("conversation.listen", "Listen to speech")}
            />
            <Typography.Text strong>
              {listen
                ? t("conversation.listeningOn", "Listening to speech on this device")
                : t("conversation.listen", "Listen to speech")}
            </Typography.Text>
            {serverAsr && mic.active && (
              <span className="conv-mic-level" style={{ "--level": mic.level }} aria-hidden="true">
                <span />
              </span>
            )}
          </Space>
        ) : isPrivate ? (
          <Typography.Text type="secondary">
            {t(
              "conversation.privateNoASR",
              "Live captions are unavailable right now. In private mode, speech is never sent to an outside service, so type instead or try again in a few minutes."
            )}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            {t(
              "conversation.noASR",
              "This browser can't turn speech into text. Use Chrome, Edge or Safari, or type instead."
            )}
          </Typography.Text>
        )}
        {serverAsrFailed && conv.asrServerSide && asr.supported && !isPrivate && (
          <Typography.Text type="secondary">
            {t(
              "conversation.asrFallback",
              "Server speech recognition is unavailable, so this device is recognising speech instead."
            )}
          </Typography.Text>
        )}
        {(serverAsr ? mic.error : asr.error) === "mic_denied" && (
          <Typography.Text type="danger">
            {t("conversation.micDenied", "Microphone access was blocked. Allow it in the browser settings.")}
          </Typography.Text>
        )}
        {serverAsr && mic.error === "mic_failed" && (
          <Typography.Text type="danger">
            {t("conversation.micFailed", "The microphone could not be started. Check that no other app is using it.")}
          </Typography.Text>
        )}
      </div>
      )}

      {!isLesson && (
      <ComposeTray
        onSpeak={onSpeak}
        onReject={onReject}
        onTyping={(isTyping) => send("typing.state", { is_typing: isTyping })}
        onRequestSuggestions={() =>
          send("draft.request", { kind: "predictive_replies", n: 3, request_id: newId() })
        }
        suggestions={conv.suggestions}
        llmAvailable={conv.llmAvailable}
        disabled={status !== "open"}
        prefill={prefill}
        voices={voices.voices}
        voiceId={voices.voiceId}
        onVoiceChange={voices.setVoiceId}
      />
      )}

      <ShareCodeModal
        open={Boolean(share)}
        onClose={() => setShare(null)}
        code={share?.joinCode}
        expiresAt={share?.expiresAt}
      />
    </div>
  );
}
