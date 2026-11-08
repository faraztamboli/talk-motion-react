import React from "react";
import { Button, Modal, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/** Shows the join code big enough to read across a counter, plus a link to send. */
export default function ShareCodeModal({ open, onClose, code, expiresAt }) {
  const { t } = useTranslation();
  if (!code) return null;
  const link = `${window.location.origin}/c/${code}`;
  const until = expiresAt ? new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      message.success(t("conversation.copied", "Link copied"));
    } catch {
      message.info(link);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("conversation.shareTitle", "Join on another phone")}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={copy}>
          {t("conversation.copyLink", "Copy link")}
        </Button>,
        <Button key="done" type="primary" onClick={onClose}>
          {t("conversation.done", "Done")}
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        {t(
          "conversation.shareHelp",
          "Ask the other person to open {{site}}/join and enter this code, or send them the link.",
          { site: window.location.host }
        )}
      </Typography.Paragraph>
      <div className="conv-code" aria-label={t("conversation.codeIs", "Code {{code}}", { code: code.split("").join(" ") })}>
        {code}
      </div>
      <Typography.Paragraph copyable={{ text: link }} style={{ textAlign: "center" }}>
        {link}
      </Typography.Paragraph>
      {until && (
        <Typography.Paragraph type="secondary" style={{ textAlign: "center" }}>
          {t("conversation.codeExpires", "The code works until {{time}}.", { time: until })}
        </Typography.Paragraph>
      )}
    </Modal>
  );
}
