import React, { useState } from "react";
import { Alert, Button, Card, Form, Input, Radio } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { joinConversation } from "../api";
import { saveGuestSession } from "../guestSession";
import "../conversation.css";

/**
 * /join and /c/:code. Public: the person joining (a pharmacist, a bank clerk) needs no
 * account, only the code shown on the other phone.
 */
export default function JoinPage() {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setBusy(true);
    setError(null);
    try {
      const res = await joinConversation({
        joinCode: values.code,
        displayName: values.name.trim(),
        role: values.role,
      });
      saveGuestSession(res.conversation_id, {
        participant_token: res.participant_token,
        participant_id: res.participant_id,
        role: res.role,
      });
      navigate(`/join/live/${res.conversation_id}`, { replace: true });
    } catch (err) {
      setBusy(false);
      if (err.status === 404) setError(t("conversation.badCode", "That code is not valid or has expired."));
      else if (err.status === 429) setError(t("conversation.tooManyTries", "Too many tries. Wait a minute and try again."));
      else setError(err.message);
    }
  };

  return (
    <div className="conv-root conv-guest" style={{ height: "auto", maxWidth: 560 }}>
      <Card title={t("conversation.joinTitle", "Join a conversation")}>
        <Form
          layout="vertical"
          size="large"
          initialValues={{ code: code || "", name: "", role: "partner" }}
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label={t("conversation.code", "Code from the other phone")}
            name="code"
            rules={[{ required: true, message: t("conversation.codeRequired", "Enter the code") }]}
          >
            <Input
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={12}
              style={{ letterSpacing: "0.2em", fontSize: "1.5rem", textTransform: "uppercase" }}
            />
          </Form.Item>
          <Form.Item
            label={t("conversation.yourName", "Your name")}
            name="name"
            rules={[{ required: true, whitespace: true, message: t("conversation.nameRequired", "Enter your name") }]}
          >
            <Input maxLength={80} autoComplete="name" />
          </Form.Item>
          <Form.Item name="role" label={t("conversation.whoAreYou", "Who is using this phone?")}>
            <Radio.Group className="conv-choice">
              <Radio value="partner">
                <strong>{t("conversation.rolePartner", "I can hear and speak")}</strong>
              </Radio>
              <Radio value="primary">
                <strong>{t("conversation.rolePrimary", "I am Deaf or can't speak")}</strong>
              </Radio>
            </Radio.Group>
          </Form.Item>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" block className="conv-speak-btn" loading={busy}>
            {t("conversation.join", "Join")}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
