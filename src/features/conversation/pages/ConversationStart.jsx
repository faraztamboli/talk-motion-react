import React, { useState } from "react";
import { Alert, Button, Card, Radio, Space, Switch, Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createConversation } from "../api";
import { browserASRSupported } from "../hooks/useBrowserASR";
import "../conversation.css";

/** /conversation: start a conversation on this phone, or one a second phone can join. */
export default function ConversationStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState("primary");
  const [mode, setMode] = useState("same_device");
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const conversation = await createConversation({
        mode,
        owner_role: role,
        // Phase 1 recognises speech in the browser (free). Server-side streaming ASR comes
        // with the microphone streaming ticket.
        asr_provider: "browser",
        settings: { plain_language: plainLanguage },
      });
      navigate(`/conversation/${conversation.id}`, {
        state: conversation.join_code
          ? { joinCode: conversation.join_code, expiresAt: conversation.join_code_expires_at }
          : null,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="conv-root" style={{ height: "auto" }}>
      <Card title={<><MessageOutlined /> {t("conversation.startTitle", "Start a conversation")}</>}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Title level={5}>{t("conversation.whoAreYou", "Who is using this phone?")}</Typography.Title>
            <Radio.Group className="conv-choice" value={role} onChange={(e) => setRole(e.target.value)}>
              <Radio value="primary">
                <strong>{t("conversation.rolePrimary", "I am Deaf or can't speak")}</strong>
                <div>{t("conversation.rolePrimaryHelp", "I read captions and type. The phone speaks for me.")}</div>
              </Radio>
              <Radio value="partner">
                <strong>{t("conversation.rolePartner", "I can hear and speak")}</strong>
                <div>{t("conversation.rolePartnerHelp", "I talk, and my words appear as captions.")}</div>
              </Radio>
            </Radio.Group>
          </div>

          <div>
            <Typography.Title level={5}>{t("conversation.howMany", "How many phones?")}</Typography.Title>
            <Radio.Group className="conv-choice" value={mode} onChange={(e) => setMode(e.target.value)}>
              <Radio value="same_device">
                <strong>{t("conversation.oneDevice", "Just this one")}</strong>
                <div>{t("conversation.oneDeviceHelp", "Share the screen with the other person.")}</div>
              </Radio>
              <Radio value="two_device">
                <strong>{t("conversation.twoDevices", "Two phones")}</strong>
                <div>{t("conversation.twoDevicesHelp", "The other person joins on their own phone with a code.")}</div>
              </Radio>
            </Radio.Group>
          </div>

          <Space align="center">
            <Switch checked={plainLanguage} onChange={setPlainLanguage} aria-label={t("conversation.plainToggle", "Plain-language captions")} />
            <span>
              <strong>{t("conversation.plainToggle", "Plain-language captions")}</strong>{" "}
              {t("conversation.plainToggleHelp", "(adds a simpler version of what is said, when available)")}
            </span>
          </Space>

          {!browserASRSupported() && (
            <Alert
              type="info"
              showIcon
              message={t(
                "conversation.noASR",
                "This browser can't turn speech into text. Use Chrome, Edge or Safari, or type instead."
              )}
            />
          )}
          {error && <Alert type="error" showIcon message={error} />}

          <Button type="primary" size="large" className="conv-speak-btn" loading={busy} onClick={start}>
            {t("conversation.start", "Start")}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
