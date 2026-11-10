import React, { useEffect, useRef } from "react";
import { Button, Empty, Popconfirm } from "antd";
import { MdDelete, MdPanTool, MdRecordVoiceOver } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { clearConversation } from "../../app/features/conversationSlice";

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The conversation so far: signed sentences and spoken sentences in one thread. Each side is
 * marked by an icon and a label, never by colour alone, and new entries are announced.
 */
export default function TranscriptPanel() {
  const { t } = useTranslation();
  const { entries } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries.length]);

  return (
    <section className="tm-tr-panel tm-tr-transcript" aria-labelledby="tm-tr-transcript-title">
      <header className="tm-tr-panel-head">
        <div>
          <h2 id="tm-tr-transcript-title">{t("translator.conversation", "Conversation")}</h2>
          <p className="tm-tr-muted">{t("translator.conversationSub", "Everything signed or spoken, in order")}</p>
        </div>
        {entries.length > 0 && (
          <Popconfirm
            title={t("translator.clearConversationQ", "Clear the conversation?")}
            okText={t("translator.clearConversationOk", "Clear")}
            cancelText={t("translator.cancel", "Cancel")}
            onConfirm={() => dispatch(clearConversation())}
          >
            <Button type="text" icon={<MdDelete size={18} aria-hidden />} aria-label={t("translator.clearConversation", "Clear conversation")}>
              {t("translator.clearConversationShort", "Clear")}
            </Button>
          </Popconfirm>
        )}
      </header>
      <div
        ref={scrollRef}
        className="tm-tr-log"
        role="log"
        aria-live="polite"
        aria-label={t("translator.conversationMessages", "Conversation messages")}
        tabIndex={0}
      >
        {entries.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("translator.conversationEmpty", "Start signing or speaking to see the conversation here")} />
        ) : (
          entries.map((entry) => {
            const signed = entry.source === "sign";
            return (
              <div key={entry.id} className={`tm-tr-msg ${signed ? "tm-tr-msg-sign" : "tm-tr-msg-voice"}`}>
                <div className="tm-tr-msg-meta">
                  {signed ? <MdPanTool size={14} aria-hidden /> : <MdRecordVoiceOver size={14} aria-hidden />}
                  <span>
                    {signed ? t("translator.signed", "Signed") : t("translator.spoken", "Spoken")} · {formatTime(entry.time)}
                  </span>
                </div>
                <div className="tm-tr-msg-text">{entry.text}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
