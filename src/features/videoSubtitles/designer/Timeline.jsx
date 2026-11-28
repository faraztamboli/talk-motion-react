import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { formatDuration, statusOf } from "./takes";

const STEP_S = 5;

/**
 * The whole YouTube video as one bar: your takes on it, captions under them, and where the video
 * is now. Click (or tap) anywhere to jump there (clicking a take also highlights it); arrow keys
 * move by 5 seconds.
 */
export default function Timeline({ duration, time, takes, cues, selectedKey, onSeek, onSelectTake, disabled }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const latestEnd = Math.max(0, ...(takes || []).map((r) => r.end || r.start || 0));
  const total = duration > 0 ? duration : Math.max(60, latestEnd);
  const pct = (s) => `${Math.min(100, Math.max(0, (s / total) * 100))}%`;

  const seekToPointer = (event) => {
    if (disabled) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return;
    const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
    onSeek((x / rect.width) * total);
  };

  const onKeyDown = (event) => {
    if (disabled) return;
    const moves = { ArrowLeft: -STEP_S, ArrowRight: STEP_S, PageDown: -30, PageUp: 30 };
    if (event.key in moves) onSeek(Math.min(total, Math.max(0, time + moves[event.key])));
    else if (event.key === "Home") onSeek(0);
    else if (event.key === "End") onSeek(Math.max(0, total - 1));
    else return;
    event.preventDefault();
  };

  return (
    <div className={`tm-tl ${disabled ? "is-disabled" : ""}`}>
      <div className="tm-tl-legend" aria-hidden>
        <span>
          <i className="tm-tl-swatch is-sign" /> {t("subtitles.tl.signing", "Your signing")}
        </span>
        {cues?.length > 0 && (
          <span>
            <i className="tm-tl-swatch is-cc" /> {t("subtitles.tl.captions", "Captions")}
          </span>
        )}
        <span className="tm-tl-now">
          {formatDuration(time)} / {formatDuration(total)}
        </span>
      </div>
      <div
        ref={trackRef}
        className="tm-tl-track"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={t("subtitles.tl.label", "Video timeline. Click to jump to a moment.")}
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={formatDuration(time)}
        aria-disabled={disabled || undefined}
        onPointerDown={seekToPointer}
        onKeyDown={onKeyDown}
      >
        <div className="tm-tl-lane">
          {(takes || [])
            .filter((r) => r.end > r.start)
            .map((r) => (
              <button
                type="button"
                key={r.key}
                className={`tm-tl-take is-${statusOf(r.status).tone} ${selectedKey === r.key ? "is-selected" : ""}`}
                style={{ left: pct(r.start), width: `max(6px, ${pct(r.end - r.start)})` }}
                title={`${t("subtitles.takeN", "Take {{n}}", { n: r.number })} · ${formatDuration(r.start)}–${formatDuration(r.end)} · ${t(`subtitles.takeStatus.${r.status}`, statusOf(r.status).label)}`}
                aria-label={t("subtitles.tl.takeLabel", "Take {{n}}, {{from}} to {{to}}", { n: r.number, from: formatDuration(r.start), to: formatDuration(r.end) })}
                tabIndex={-1}
                // The click also reaches the track, which jumps to the clicked moment.
                onPointerDown={() => onSelectTake?.(r)}
              />
            ))}
        </div>
        {cues?.length > 0 && (
          <div className="tm-tl-lane is-cc">
            {cues.map((c) => (
              <span key={c.id} className="tm-tl-cue" style={{ left: pct(c.startMs / 1000), width: `max(3px, ${pct((c.endMs - c.startMs) / 1000)})` }} />
            ))}
          </div>
        )}
        <span className="tm-tl-playhead" style={{ left: pct(time) }} aria-hidden />
      </div>
      <div className="tm-tl-ruler" aria-hidden>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span key={f} style={{ left: `${f * 100}%` }}>
            {formatDuration(f * total)}
          </span>
        ))}
      </div>
    </div>
  );
}

Timeline.propTypes = {
  duration: PropTypes.number,
  time: PropTypes.number,
  takes: PropTypes.array,
  cues: PropTypes.array,
  selectedKey: PropTypes.string,
  onSeek: PropTypes.func.isRequired,
  onSelectTake: PropTypes.func,
  disabled: PropTypes.bool,
};
