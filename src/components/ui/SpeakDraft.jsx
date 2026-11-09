import React from "react";
import { Button, Space, Switch, Typography } from "antd";
import { MdVolumeUp } from "react-icons/md";

/**
 * A recognized sign waiting for the signer to say it out loud. Nothing is spoken until they
 * tap Speak, unless they turned on "Speak automatically" themselves.
 */
export function SpeakDraft({ draft, confirm, dismiss, autoSpeak, setAutoSpeak, volume }) {
  return (
    <div className="speak-draft" style={{ marginTop: "var(--spacing-sm)" }}>
      {draft && !autoSpeak && (
        <div
          role="region"
          aria-live="polite"
          aria-label="Recognized sign, not spoken yet"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--spacing-sm)",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            border: "1px solid var(--color-neutral-200)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-neutral-50)",
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{draft}</span>
          <Space>
            <Button onClick={dismiss}>Not this</Button>
            <Button type="primary" icon={<MdVolumeUp aria-hidden="true" />} onClick={() => confirm(volume)}>
              Speak
            </Button>
          </Space>
        </div>
      )}
      <Space align="center" style={{ marginTop: "var(--spacing-xs)" }}>
        <Switch checked={autoSpeak} onChange={setAutoSpeak} size="small" aria-label="Speak automatically" />
        <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
          {autoSpeak
            ? "Speak automatically is on: recognized signs are spoken right away."
            : "Recognized signs wait for you to tap Speak."}
        </Typography.Text>
      </Space>
    </div>
  );
}

export default SpeakDraft;
