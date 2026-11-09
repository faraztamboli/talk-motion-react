import React, { useEffect, useRef } from "react";
import { Button, Empty, Tooltip } from "antd";
import { MdDelete, MdPanTool, MdRecordVoiceOver } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { clearConversation } from "../../app/features/conversationSlice";

function formatTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Unified conversation feed: signed utterances (recognized from camera) and
 * spoken utterances (recognized from mic) rendered as one chat-style thread.
 * The list is an ARIA live region so screen-reader users hear new entries,
 * and each side is distinguished by icon + label + color (never color alone).
 */
export const ConversationTranscript = () => {
  const { entries } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div
      className="converter-card-content"
      role="region"
      aria-labelledby="conversation-transcript-title"
    >
      <div
        className="flex flex-between-center"
        style={{ marginBottom: "var(--spacing-xs)" }}
      >
        <div>
          <h2
            id="conversation-transcript-title"
            className="mb-0"
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Conversation
          </h2>
          <p
            style={{
              margin: "2px 0",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            Everything signed or spoken, in order
          </p>
        </div>
        {entries.length > 0 && (
          <Tooltip title="Clear conversation">
            <Button
              type="text"
              icon={<MdDelete size={20} aria-hidden="true" />}
              onClick={() => dispatch(clearConversation())}
              aria-label="Clear conversation transcript"
            />
          </Tooltip>
        )}
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        tabIndex={0}
        style={{
          maxHeight: "280px",
          minHeight: "120px",
          overflowY: "auto",
          padding: "var(--spacing-sm)",
          backgroundColor: "var(--color-neutral-50)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-neutral-200)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xs)",
        }}
      >
        {entries.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Start signing or speaking to see the conversation here"
            style={{ margin: "auto" }}
          />
        ) : (
          entries.map((entry) => {
            const isSign = entry.source === "sign";
            return (
              <div
                key={entry.id}
                style={{
                  alignSelf: isSign ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "2px",
                    justifyContent: isSign ? "flex-start" : "flex-end",
                  }}
                >
                  {isSign ? (
                    <MdPanTool
                      size={14}
                      aria-hidden="true"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  ) : (
                    <MdRecordVoiceOver
                      size={14}
                      aria-hidden="true"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {isSign ? "Signed" : "Spoken"} · {formatTime(entry.time)}
                  </span>
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    backgroundColor: isSign ? "#e6f4ff" : "#f6ffed",
                    border: `1px solid ${isSign ? "#91caff" : "#b7eb8f"}`,
                    color: "var(--color-text-primary)",
                    wordBreak: "break-word",
                  }}
                >
                  {entry.text}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationTranscript;
