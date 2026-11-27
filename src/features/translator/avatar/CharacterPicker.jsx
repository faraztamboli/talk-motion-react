import React from "react";
import PropTypes from "prop-types";
import { Button, Checkbox, Popover, Select } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { CHARACTERS, MODELS, PALETTES, editableParts } from "./characters";

// What each colour setting looks like on the model, to draw the swatches
const BASE = { skin: [0.95, 0.78, 0.67], hair: [0.48, 0.32, 0.2], outfit: [0.82, 0.85, 0.92] };

const swatchColor = (part, mul) => {
  const c = BASE[part].map((v, i) => Math.round(Math.max(0, Math.min(1, v * mul[i])) * 255));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

const PART_LABEL = { skin: "Skin", hair: "Hair", outfit: "Clothes" };

function Swatches({ part, value, onChange }) {
  const { t } = useTranslation();
  const label = t(`translator.avatarPart_${part}`, PART_LABEL[part]);
  return (
    <div className="tm-tr-swatch-row" role="radiogroup" aria-label={label}>
      <span className="tm-tr-swatch-label">{label}</span>
      {PALETTES[part].map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          aria-label={`${label}: ${p.name}`}
          title={p.name}
          className={`tm-tr-swatch ${value === p.id ? "is-on" : ""}`}
          style={{ background: swatchColor(part, p.mul) }}
          onClick={() => onChange(part, p.id)}
        />
      ))}
    </div>
  );
}

Swatches.propTypes = { part: PropTypes.string.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired };

/** Choose the avatar's character and, for characters that allow it, their colours. */
export default function CharacterPicker({ character, look, skeleton, onCharacter, onPart, onReset, onSkeleton }) {
  const { t } = useTranslation();
  const parts = editableParts(character);
  const credit = MODELS[character.model]?.credit;
  const options = CHARACTERS.map((c) => ({ value: c.id, label: c.name }));
  const customize = (
    <div className="tm-tr-customize">
      {parts.map((part) => (
        <Swatches key={part} part={part} value={look?.[part]} onChange={onPart} />
      ))}
      <Button size="small" onClick={onReset}>
        {t("translator.avatarReset", "Back to the original look")}
      </Button>
    </div>
  );
  return (
    <div className="tm-tr-character-picker">
      <label className="tm-tr-field">
        <span>{t("translator.avatarCharacter", "Character")}</span>
        <Select
          size="small"
          value={character.id}
          onChange={onCharacter}
          options={options}
          style={{ minWidth: 170 }}
          aria-label={t("translator.avatarCharacter", "Character")}
        />
      </label>
      {parts.length > 0 && (
        <Popover content={customize} trigger="click" title={t("translator.avatarCustomize", "Choose a look")} placement="bottom">
          <Button size="small" icon={<BgColorsOutlined aria-hidden />}>
            {t("translator.avatarLook", "Look")}
          </Button>
        </Popover>
      )}
      {character.kind !== "wireframe" && onSkeleton && (
        <Checkbox checked={Boolean(skeleton)} onChange={(e) => onSkeleton(e.target.checked)}>
          {t("translator.avatarShowSkeleton", "Show the skeleton too")}
        </Checkbox>
      )}
      {credit && <span className="tm-tr-credit">{credit}</span>}
    </div>
  );
}

CharacterPicker.propTypes = {
  character: PropTypes.object.isRequired,
  look: PropTypes.object,
  onCharacter: PropTypes.func.isRequired,
  onPart: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  skeleton: PropTypes.bool,
  onSkeleton: PropTypes.func,
};
