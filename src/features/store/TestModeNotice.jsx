import React from "react";
import PropTypes from "prop-types";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

/** Says so when the server takes payments in Stripe test mode (no real charges). */
export default function TestModeNotice({ config }) {
  const { t } = useTranslation();
  if (!config || config.mode !== "test") return null;
  return (
    <Alert
      type="warning"
      showIcon
      className="tm-block-sm"
      message={t("store.testMode", "Test mode: no real payments are taken. Use card 4242 4242 4242 4242 with any future date.")}
    />
  );
}

TestModeNotice.propTypes = { config: PropTypes.object };
