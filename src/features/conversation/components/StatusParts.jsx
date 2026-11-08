import React from "react";
import { Alert, Badge } from "antd";
import { AudioOutlined, EditOutlined, SoundOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/** Socket state as words, not just a coloured dot. */
export function ConnectionBanner({ status, ended }) {
  const { t } = useTranslation();
  if (ended || status === "open" || status === "idle") return null;
  const map = {
    connecting: ["info", t("conversation.connecting", "Connecting…")],
    reconnecting: ["warning", t("conversation.reconnecting", "Connection lost. Reconnecting…")],
    closed: ["error", t("conversation.disconnected", "Disconnected. Reload the page to try again.")],
  };
  const [type, message] = map[status] || map.connecting;
  return <Alert type={type} message={message} showIcon role="status" />;
}

export function ParticipantsBar({ participants, meId }) {
  const { t } = useTranslation();
  const list = Object.values(participants);
  return (
    <div className="conv-participants" aria-label={t("conversation.participants", "People in this conversation")}>
      {list.map((p) => (
        <span key={p.participantId}>
          <Badge status={p.online ? "success" : "default"} />
          {p.participantId === meId ? t("conversation.you", "You") : p.displayName}{" "}
          <span style={{ color: "var(--color-neutral-600, #595959)" }}>
            ({p.online ? t("conversation.online", "here") : t("conversation.away", "away")})
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Visual turn-taking: what is happening right now, in words and an icon. The "speaking for
 * you" state matters most: it is the only way a Deaf user knows the phone is talking.
 */
export function TurnIndicator({ speaking, talkingNames, typingNames, listening }) {
  const { t } = useTranslation();
  let className = "conv-turn";
  let icon = null;
  let text = "";
  if (speaking) {
    className += " is-speaking";
    icon = <SoundOutlined className="conv-turn-icon" aria-hidden />;
    text = `${t("conversation.speakingNow", "Speaking out loud")}: “${speaking.text}”`;
  } else if (talkingNames.length) {
    className += " is-other";
    icon = <AudioOutlined className="conv-turn-icon" aria-hidden />;
    text = t("conversation.isTalking", "{{names}} is talking…", { names: talkingNames.join(", ") });
  } else if (typingNames.length) {
    className += " is-other";
    icon = <EditOutlined className="conv-turn-icon" aria-hidden />;
    text = t("conversation.isTyping", "{{names}} is typing…", { names: typingNames.join(", ") });
  } else if (listening) {
    icon = <AudioOutlined aria-hidden />;
    text = t("conversation.listening", "Listening. Speech will appear as captions.");
  }
  return (
    <div className={className} role="status" aria-live="polite">
      {icon}
      <span>{text}</span>
    </div>
  );
}
