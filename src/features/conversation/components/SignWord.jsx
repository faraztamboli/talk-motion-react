import React, { useState } from "react";
import { Popover, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { lookupSign } from "../dictionaryApi";

function SignBody({ word, state }) {
  const { t } = useTranslation();
  if (state.status === "loading") return <Spin size="small" aria-label={t("conversation.signLoading", "Loading sign")} />;
  if (state.status === "error") {
    return <p className="conv-sign-note">{t("conversation.signError", "Could not load the sign. Try again.")}</p>;
  }
  const video = state.data?.videos?.[0];
  if (!video) {
    return (
      <div className="conv-sign-note">
        <p>{t("conversation.signNone", "No sign video for this word yet")}</p>
        <p>
          {t("conversation.signFingerspell", "You can fingerspell it letter by letter: {{letters}}", {
            letters: word.toUpperCase().split("").join(" "),
          })}
        </p>
      </div>
    );
  }
  return (
    <video
      className="conv-sign-video"
      src={video.url}
      muted
      loop
      autoPlay
      playsInline
      aria-label={t("conversation.signVideoLabel", "Sign for {{word}}", { word })}
    />
  );
}

/** One tappable word of a final caption: opens a popover with its sign video. */
export default function SignWord({ raw, word }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ status: "idle" });

  const onOpenChange = (next) => {
    setOpen(next);
    if (next && state.status !== "ready") {
      setState({ status: "loading" });
      lookupSign(word).then(
        (data) => setState({ status: "ready", data }),
        () => setState({ status: "error" })
      );
    }
  };

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      title={word}
      content={open ? <SignBody word={word} state={state} /> : null}
      destroyTooltipOnHide
    >
      <button type="button" className="conv-word" aria-haspopup="dialog" aria-expanded={open}>
        {raw}
      </button>
    </Popover>
  );
}
