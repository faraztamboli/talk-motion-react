import React, { useEffect, useRef } from "react";
import { AudioOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import SignWord from "./SignWord";
import { normaliseWord } from "../dictionaryApi";

/** Splits a final caption into words; each word with letters becomes a button. */
function TappableText({ text }) {
  return String(text)
    .split(/(\s+)/)
    .map((part, i) => {
      const word = normaliseWord(part);
      return word ? <SignWord key={i} raw={part} word={word} /> : part;
    });
}

function speakerName(participants, pid, meId, t) {
  if (pid === meId) return t("conversation.you", "You");
  return participants[pid]?.displayName || t("conversation.someone", "Someone");
}

/**
 * The shared transcript: final captions with speaker labels, plus text still being
 * recognised for each speaker. Speech shows a microphone icon, typed text a pencil, so the
 * source never depends on colour.
 */
export default function CaptionStream({ utterances, partials, participants, meId, showPlain, showGloss, tapWords = false }) {
  const { t } = useTranslation();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [utterances.length, partials]);

  const partialEntries = Object.entries(partials).filter(([, text]) => text);

  return (
    <div className="conv-captions">
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label={t("conversation.captions", "Captions")}>
        {utterances.length === 0 && partialEntries.length === 0 && (
          <p className="conv-empty">
            {t(
              "conversation.emptyHint",
              "Captions appear here. Type below to speak, or tap Listen so speech becomes text."
            )}
          </p>
        )}
        {utterances.map((u) => {
          const mine = u.participant_id === meId;
          const spoken = u.source === "speech";
          return (
            <div key={u.id} className={`conv-caption${mine ? " conv-mine" : ""}`}>
              <div className="conv-speaker">
                {spoken ? <AudioOutlined aria-hidden /> : <EditOutlined aria-hidden />}
                <span>{speakerName(participants, u.participant_id, meId, t)}</span>
                <span className="sr-only">
                  {spoken ? t("conversation.said", "said") : t("conversation.wrote", "wrote")}
                </span>
              </div>
              <div className="conv-text">{tapWords ? <TappableText text={u.text} /> : u.text}</div>
              {showPlain && u.plain_text && (
                <div className="conv-plain">
                  <strong>{t("conversation.plain", "Plain language")}:</strong> {u.plain_text}
                </div>
              )}
              {showGloss && u.gloss && (
                <div className="conv-gloss">
                  <strong>{t("conversation.gloss", "Gloss")}:</strong> {u.gloss}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Words still being recognised change many times a second: keep them out of the live region. */}
      <div aria-live="off">
        {partialEntries.map(([pid, text]) => (
          <div key={pid} className="conv-caption">
            <div className="conv-speaker">
              <AudioOutlined aria-hidden />
              <span>{speakerName(participants, pid, meId, t)}</span>
            </div>
            <div className="conv-partial">{text}…</div>
          </div>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
}
