import React, { useEffect, useState } from "react";
import { Button, Space, Typography, message } from "antd";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getConversation, shareConversation } from "../api";

export const LESSON_LINK_BASE = "https://app.talk-motion.com";

export function lessonLink(code) {
  return `${LESSON_LINK_BASE}/c/${code}`;
}

/**
 * Teacher's join panel: the code in very large type for the board, plus the link to paste into
 * a class chat. (No QR code: no QR library is a dependency of this app.)
 */
export default function LessonPanel({ conversationId, initialShare }) {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialShare?.joinCode || null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (code) return;
    getConversation(conversationId)
      .then((c) => setCode(c.join_code || null))
      .catch(() => {});
  }, [code, conversationId]);

  const renew = async () => {
    setBusy(true);
    try {
      const res = await shareConversation(conversationId);
      setCode(res.join_code);
    } catch (err) {
      message.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const link = code ? lessonLink(code) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      message.success(t("lesson.copied", "Link copied"));
    } catch {
      message.info(link);
    }
  };

  return (
    <section className="conv-lesson-panel" aria-label={t("lesson.joinPanel", "How students join")}>
      <Typography.Text type="secondary">
        {t("lesson.joinHelp", "Students open the link below, or go to {{site}}/join and type this code.", {
          site: "app.talk-motion.com",
        })}
      </Typography.Text>
      {code ? (
        <>
          <div
            className="conv-code"
            data-testid="lesson-code"
            aria-label={t("conversation.codeIs", "Code {{code}}", { code: code.split("").join(" ") })}
          >
            {code}
          </div>
          <Typography.Paragraph style={{ textAlign: "center", marginBottom: 8 }}>
            <a href={link}>{link}</a>
          </Typography.Paragraph>
          <Space wrap style={{ justifyContent: "center", width: "100%" }}>
            <Button icon={<CopyOutlined />} onClick={copy}>
              {t("lesson.copyLink", "Copy link")}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={renew} loading={busy}>
              {t("lesson.newCode", "New code")}
            </Button>
          </Space>
        </>
      ) : (
        <Typography.Paragraph>{t("lesson.codeLoading", "Getting the join code...")}</Typography.Paragraph>
      )}
    </section>
  );
}
