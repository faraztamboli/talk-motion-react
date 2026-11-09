import React from "react";
import PropTypes from "prop-types";
import { Button, Popover, Space, Spin } from "antd";
import { useTranslation } from "react-i18next";

const pct = (c) => `${Math.round(c * 100)}%`;

function WordChip({ word, onChoose, onRemove, onConfirm }) {
  const { t } = useTranslation();
  const tentative = word.status === "tentative";
  const content = (
    <div className="tm-tr-word-pop">
      <p className="tm-tr-muted">
        {t("translator.confidence", "Confidence")}: {pct(word.confidence)}
      </p>
      {word.alternatives.length > 0 && (
        <>
          <p className="tm-tr-pop-title">{t("translator.didYouMean", "Did you mean")}</p>
          <Space wrap>
            {word.alternatives.map((alt) => (
              <Button key={alt.word} size="small" onClick={() => onChoose(word.id, alt.word)}>
                {alt.word} <span className="tm-tr-muted">({pct(alt.confidence)})</span>
              </Button>
            ))}
          </Space>
        </>
      )}
      <Space className="tm-tr-pop-actions">
        {tentative && (
          <Button size="small" type="primary" onClick={() => onConfirm(word.id)}>
            {t("translator.keepWord", "Keep “{{word}}”", { word: word.word })}
          </Button>
        )}
        <Button size="small" danger onClick={() => onRemove(word.id)}>
          {t("translator.removeWord", "Remove")}
        </Button>
      </Space>
    </div>
  );
  return (
    <Popover content={content} trigger="click" placement="top">
      <button
        type="button"
        className={`tm-tr-chip ${tentative ? "tm-tr-chip-tentative" : ""}`}
        aria-label={
          tentative
            ? t("translator.chipTentative", "{{word}}, not sure ({{pct}}). Choose to change or remove.", {
                word: word.word,
                pct: pct(word.confidence),
              })
            : t("translator.chipFirm", "{{word}} ({{pct}}). Choose to change or remove.", {
                word: word.word,
                pct: pct(word.confidence),
              })
        }
      >
        {word.word}
        {tentative && <span aria-hidden>?</span>}
      </button>
    </Popover>
  );
}

WordChip.propTypes = {
  word: PropTypes.object.isRequired,
  onChoose: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

/** The sentence so far: one chip per recognized sign, plus signs still being recognized. */
export default function SentenceChips({ words, pendingCount, onChoose, onRemove, onConfirm, placeholder }) {
  const { t } = useTranslation();
  return (
    <div className="tm-tr-sentence" aria-live="polite" aria-label={t("translator.sentence", "Sentence so far")}>
      {words.map((w) => (
        <WordChip key={w.id} word={w} onChoose={onChoose} onRemove={onRemove} onConfirm={onConfirm} />
      ))}
      {pendingCount > 0 && (
        <span className="tm-tr-chip tm-tr-chip-pending" role="status">
          <Spin size="small" /> {t("translator.recognizing", "Recognizing…")}
        </span>
      )}
      {!words.length && !pendingCount && <span className="tm-tr-muted">{placeholder}</span>}
    </div>
  );
}

SentenceChips.propTypes = {
  words: PropTypes.array.isRequired,
  pendingCount: PropTypes.number,
  onChoose: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  placeholder: PropTypes.node,
};
