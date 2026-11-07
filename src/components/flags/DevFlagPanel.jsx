import React from "react";
import { Card, Space, Switch, Tag, Typography, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { FLAG_NAMES, overridesEnabled, saveLocalOverrides } from "../../config/flags";
import { setOverrides } from "../../app/features/flagsSlice";

/**
 * Developer-only panel to override feature flags in this browser.
 * Hidden in production builds unless VITE_FLAG_OVERRIDES=true.
 */
export default function DevFlagPanel() {
  const dispatch = useDispatch();
  const { values, overrides, source } = useSelector((state) => state.flags);

  if (!overridesEnabled()) return null;

  const toggle = (name, checked) => {
    dispatch(setOverrides(saveLocalOverrides({ ...overrides, [name]: checked })));
  };
  const reset = () => dispatch(setOverrides(saveLocalOverrides({})));

  return (
    <Card
      title="Feature flags (developer overrides)"
      size="small"
      style={{ marginTop: "2rem" }}
      extra={
        <Button size="small" onClick={reset} disabled={!Object.keys(overrides).length}>
          Reset overrides
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        Values come from {source === "server" ? "your account" : "build defaults"}. Overrides apply to this
        browser only.
      </Typography.Paragraph>
      <Space direction="vertical">
        {FLAG_NAMES.map((name) => (
          <Space key={name}>
            <Switch
              checked={Boolean(values[name])}
              onChange={(checked) => toggle(name, checked)}
              aria-label={`Toggle ${name}`}
            />
            <Typography.Text code>{name}</Typography.Text>
            {name in overrides && <Tag color="orange">overridden</Tag>}
          </Space>
        ))}
      </Space>
    </Card>
  );
}
