import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Input, Radio, Select, Space, Switch, Typography } from "antd";
import { HistoryOutlined, MessageOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { createConversation } from "../api";
import "../conversation.css";

const PERSONAL = "personal";

/** /conversation: start a conversation on this phone, or one a second phone can join. */
export default function ConversationStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgs = useSelector((state) => state.apiAuth?.user?.orgs);
  const locations = useMemo(() => (orgs || []).filter((o) => o.kind === "venue"), [orgs]);
  const [role, setRole] = useState("primary");
  const [mode, setMode] = useState("same_device");
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [partnerLabel, setPartnerLabel] = useState("");
  const [location, setLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Staff at one location start conversations for it unless they choose otherwise.
  const locationValue = location ?? (locations.length ? locations[0].id : PERSONAL);
  const chosenLocation = locations.find((l) => l.id === locationValue);
  const privateMode = Boolean(chosenLocation) && chosenLocation.private_mode !== false;

  const start = async () => {
    setBusy(true);
    setError(null);
    const settings = privateMode ? {} : { plain_language: plainLanguage };
    if (mode === "same_device" && partnerLabel.trim()) settings.partner_label = partnerLabel.trim();
    try {
      const conversation = await createConversation({
        mode,
        owner_role: role,
        // No asr_provider: the server picks its default (self-hosted Kyutai when deployed,
        // otherwise the browser's own recognition). The screen adapts after hello.ack.
        settings,
        ...(locationValue !== PERSONAL ? { location_id: locationValue } : {}),
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
      <Card
        title={<><MessageOutlined /> {t("conversation.startTitle", "Start a conversation")}</>}
        extra={
          <Link to="/conversation/history">
            <HistoryOutlined /> {t("conversation.history", "My conversations")}
          </Link>
        }
      >
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

          {mode === "same_device" && (
            <div>
              <Typography.Title level={5}>
                <label htmlFor="conv-partner-label">
                  {t("conversation.partnerLabel", "Who are you talking to? (optional)")}
                </label>
              </Typography.Title>
              <Input
                id="conv-partner-label"
                size="large"
                maxLength={40}
                value={partnerLabel}
                onChange={(e) => setPartnerLabel(e.target.value)}
                placeholder={t("conversation.partnerLabelHint", "For example: Pharmacist")}
              />
              <Typography.Text type="secondary">
                {t("conversation.partnerLabelHelp", "Their words are labelled with this name. Otherwise: Other person.")}
              </Typography.Text>
            </div>
          )}

          {locations.length > 0 && (
            <div>
              <Typography.Title level={5}>
                <label htmlFor="conv-location">{t("conversation.location", "For which location?")}</label>
              </Typography.Title>
              <Select
                id="conv-location"
                size="large"
                style={{ width: "100%" }}
                value={locationValue}
                onChange={setLocation}
                options={[
                  ...locations.map((l) => ({ value: l.id, label: l.name })),
                  { value: PERSONAL, label: t("conversation.personalUse", "Just me (not for a location)") },
                ]}
              />
              <Typography.Text type="secondary">
                {t("conversation.locationHelp", "Counted in the location's monthly summary. What is said is never included.")}
              </Typography.Text>
              {privateMode && (
                <div className="conv-private-line" role="note">
                  {t(
                    "conversation.privateHelp",
                    "Private mode: what is said stays on TalkMotion's servers and these phones. Replies use the phone's own voice, suggestions and plain language are off, and the words are deleted shortly after the conversation ends."
                  )}
                </div>
              )}
            </div>
          )}

          {!privateMode && (
            <Space align="center">
              <Switch checked={plainLanguage} onChange={setPlainLanguage} aria-label={t("conversation.plainToggle", "Plain-language captions")} />
              <span>
                <strong>{t("conversation.plainToggle", "Plain-language captions")}</strong>{" "}
                {t("conversation.plainToggleHelp", "(adds a simpler version of what is said, when available)")}
              </span>
            </Space>
          )}

          <Typography.Text type="secondary">
            {t(
              "conversation.interpreterStart",
              "For health, legal or money matters, ask for a qualified interpreter. TalkMotion helps when none is available."
            )}
          </Typography.Text>

          {error && <Alert type="error" showIcon message={error} />}

          <Button type="primary" size="large" className="conv-speak-btn" loading={busy} onClick={start}>
            {t("conversation.start", "Start")}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
