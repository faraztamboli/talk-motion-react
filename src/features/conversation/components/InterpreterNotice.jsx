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
 * Every conversation shows this reminder. The first time it is a full notice; once a person
 * closes it on this device it shrinks to one line, so the reminder and the one-tap request are
 * always there. "Ask for an interpreter" only fills the compose box: like every other reply,
 * nothing is spoken until the person presses Speak.
 */
export default function InterpreterNotice({ onAsk }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INTERPRETER_NOTICE_KEY, "1");
    } catch {
      // private mode or blocked storage: shrink for this visit only
    }
  };

  const ask = onAsk && (
    <Button size="small" onClick={onAsk}>
      {t("conversation.interpreterAsk", "Ask for an interpreter")}
    </Button>
  );

  if (dismissed) {
    return (
      <div className="conv-interpreter-line" role="note">
        {t("conversation.interpreterLine", "Health, legal or money matter? A qualified interpreter is best.")} {ask}
      </div>
    );
  }

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
      action={ask}
    />
  );
}

export const INTERPRETER_REQUEST_TEXT = "I would like a sign language interpreter, please.";
