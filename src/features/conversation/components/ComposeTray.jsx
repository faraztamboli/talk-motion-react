import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { BulbOutlined, CloseOutlined, SoundOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const TYPING_IDLE_MS = 2000;

/**
 * Where the Deaf or non-speaking person writes what they want said.
 *
 * Nothing is spoken until they press Speak (or Enter). Suggestions only fill the box: the
 * person can edit them, and a dismissed set is reported as rejected.
 */
export default function ComposeTray({
  onSpeak,
  onReject,
  onTyping,
  onRequestSuggestions,
  suggestions,
  llmAvailable,
  disabled,
  prefill = null, // { text, nonce }: fills the box (never speaks); a new nonce refills
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [draft, setDraft] = useState(null); // suggestion the text started from
  const typingRef = useRef(false);
  const idleTimer = useRef(null);
  const inputRef = useRef(null);

  const setTyping = (value) => {
    if (typingRef.current === value) return;
    typingRef.current = value;
    onTyping?.(value);
  };

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  useEffect(() => {
    if (!prefill?.text) return;
    setText(prefill.text);
    setDraft(null);
    inputRef.current?.focus();
  }, [prefill?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (event) => {
    setText(event.target.value);
    setTyping(Boolean(event.target.value));
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
  };

  const speak = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSpeak({ text: value, draft });
    setText("");
    setDraft(null);
    clearTimeout(idleTimer.current);
    setTyping(false);
    inputRef.current?.focus();
  };

  const pickSuggestion = (item) => {
    setText(item.text);
    setDraft({ text: item.text, draftId: suggestions?.draftId || null });
    inputRef.current?.focus();
  };

  const dismissSuggestions = () => {
    (suggestions?.items || []).forEach((item) =>
      onReject?.({ text: item.text, draftId: suggestions?.draftId || null })
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      speak();
    } else if (event.key === "Escape") {
      setText("");
      setDraft(null);
      setTyping(false);
    }
  };

  const items = suggestions?.items || [];

  return (
    <div className="conv-tray">
      {items.length > 0 && (
        <div className="conv-chips" role="group" aria-label={t("conversation.suggestions", "Suggested replies")}>
          {items.map((item) => (
            <Button key={item.text} className="conv-chip" onClick={() => pickSuggestion(item)}>
              {item.text}
            </Button>
          ))}
          <Button icon={<CloseOutlined />} onClick={dismissSuggestions} aria-label={t("conversation.notThese", "Not these")}>
            {t("conversation.notThese", "Not these")}
          </Button>
        </div>
      )}
      <Input.TextArea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 2, maxRows: 5 }}
        maxLength={1000}
        placeholder={t("conversation.typeHere", "Type what you want to say")}
        aria-label={t("conversation.typeHere", "Type what you want to say")}
        disabled={disabled}
      />
      <div className="conv-tray-row">
        <Button
          type="primary"
          size="large"
          className="conv-speak-btn"
          icon={<SoundOutlined />}
          onClick={speak}
          disabled={disabled || !text.trim()}
        >
          {t("conversation.speak", "Speak")}
        </Button>
        {llmAvailable && (
          <Tooltip title={t("conversation.suggestHint", "Suggestions are never spoken until you press Speak")}>
            <Button size="large" icon={<BulbOutlined />} onClick={onRequestSuggestions} disabled={disabled}>
              {t("conversation.suggest", "Suggest replies")}
            </Button>
          </Tooltip>
        )}
        {draft && (
          <span className="conv-draft-note">{t("conversation.fromSuggestion", "Edited from a suggestion")}</span>
        )}
      </div>
    </div>
  );
}
