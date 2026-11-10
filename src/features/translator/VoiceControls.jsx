import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Button, Select, Slider, Tooltip } from "antd";
import { MdVolumeOff, MdVolumeUp } from "react-icons/md";
import { useTranslation } from "react-i18next";

const RATES = [0.8, 1, 1.2, 1.4];

/** Voice, speed and volume for spoken sentences (useSpeechOutput). */
export default function VoiceControls({ speech, disabled }) {
  const { t } = useTranslation();
  const lastVolume = useRef(speech.volume || 0.8);
  if (!speech.supported) {
    return (
      <p className="tm-tr-muted">
        {t("translator.noTts", "This browser can't speak aloud, so sentences are shown as text only.")}
      </p>
    );
  }
  const muted = speech.volume === 0;
  const percent = Math.round(speech.volume * 100);
  const toggleMute = () => {
    if (muted) speech.setVolume(lastVolume.current || 0.8);
    else {
      lastVolume.current = speech.volume;
      speech.setVolume(0);
    }
  };

  return (
    <div className="tm-tr-voice" role="group" aria-label={t("translator.voiceGroup", "Spoken voice")}>
      <label className="tm-tr-field">
        <span>{t("translator.voice", "Voice")}</span>
        <Select
          size="small"
          value={speech.voice?.voiceURI}
          onChange={speech.setVoiceUri}
          disabled={disabled || !speech.voices.length}
          placeholder={t("translator.voiceLoading", "Loading voices…")}
          options={speech.voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))}
          className="tm-tr-voice-select"
          popupMatchSelectWidth={false}
          aria-label={t("translator.voice", "Voice")}
        />
      </label>
      <label className="tm-tr-field">
        <span>{t("translator.rate", "Speed")}</span>
        <Select
          size="small"
          value={speech.rate}
          onChange={speech.setRate}
          disabled={disabled}
          options={RATES.map((r) => ({ value: r, label: `${r}×` }))}
          aria-label={t("translator.rate", "Speed")}
        />
      </label>
      <div className="tm-tr-volume">
        <Tooltip title={muted ? t("translator.unmute", "Unmute") : t("translator.mute", "Mute")}>
          <Button
            type="text"
            size="small"
            onClick={toggleMute}
            disabled={disabled}
            aria-label={muted ? t("translator.unmute", "Unmute") : t("translator.mute", "Mute")}
            aria-pressed={muted}
            icon={muted ? <MdVolumeOff size={18} aria-hidden /> : <MdVolumeUp size={18} aria-hidden />}
          />
        </Tooltip>
        <Slider
          className="tm-tr-volume-slider"
          min={0}
          max={100}
          value={percent}
          onChange={(v) => speech.setVolume(v / 100)}
          disabled={disabled}
          tooltip={{ formatter: (v) => `${v}%` }}
          aria-label={t("translator.volume", "Volume")}
          aria-valuetext={`${percent}%`}
        />
        <span className="tm-tr-volume-value" aria-hidden>
          {muted ? t("translator.muted", "Muted") : `${percent}%`}
        </span>
      </div>
    </div>
  );
}

VoiceControls.propTypes = {
  speech: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};
