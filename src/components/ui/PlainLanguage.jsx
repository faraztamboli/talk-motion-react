import React from "react";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { usePlainLanguage, usePlainLanguageToggle } from "../../hooks/usePlainLanguage";

/** "Plain language" toggle plus the simplified sentence, shown under a translator result. */
export function PlainLanguage({ text }) {
  const { t } = useTranslation();
  const authed = useSelector((state) => state.apiAuth.status === "authenticated");
  const [enabled, setEnabled] = usePlainLanguageToggle();
  const { plain, loading, error } = usePlainLanguage(text, enabled);

  if (!authed || !text) return null;
  const label = t("translator.plainLanguage", "Plain language");

  return (
    <div style={{ marginTop: "var(--spacing-xs)" }} data-testid="plain-language">
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
        <Switch size="small" checked={enabled} onChange={setEnabled} aria-label={label} />
        <span>{label}</span>
      </label>
      {enabled && (
        <p role="status" aria-live="polite" style={{ margin: "4px 0 0", fontSize: "0.875rem" }}>
          {plain && <span>{plain}</span>}
          {loading && !plain && (
            <span style={{ color: "var(--color-text-secondary)" }}>{t("translator.plainLoading", "Simplifying...")}</span>
          )}
          {error && (
            <span style={{ color: "var(--color-text-secondary)" }}>
              {t("translator.plainError", "Plain language is unavailable right now.")}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export default PlainLanguage;
