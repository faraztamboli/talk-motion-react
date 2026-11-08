import React, { useState } from "react";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";

export const INTERPRETER_NOTICE_KEY = "tm_interpreter_notice_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(INTERPRETER_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * TalkMotion does not replace interpreters (policy, server/docs/marketing/01 §0).
 *
 * Reminds both people that health, legal and money conversations deserve a qualified
 * interpreter. "Ask for an interpreter" only fills the compose box: like every other
 * reply, nothing is spoken until the person presses Speak. Dismissal is remembered on
 * this device.
 */
export default function InterpreterNotice({ onAsk }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INTERPRETER_NOTICE_KEY, "1");
    } catch {
      // private mode or blocked storage: hide for this visit only
    }
  };

  return (
    <Alert
      className="conv-interpreter"
      type="info"
      showIcon
      closable
      onClose={dismiss}
      message={t("conversation.interpreterTitle", "About your health, the law or money?")}
      description={t(
        "conversation.interpreterBody",
        "Ask for a qualified interpreter. TalkMotion helps when no interpreter is available. It does not replace one."
      )}
      action={
        onAsk && (
          <Button size="small" onClick={onAsk}>
            {t("conversation.interpreterAsk", "Ask for an interpreter")}
          </Button>
        )
      }
    />
  );
}

export const INTERPRETER_REQUEST_TEXT = "I would like a sign language interpreter, please.";
