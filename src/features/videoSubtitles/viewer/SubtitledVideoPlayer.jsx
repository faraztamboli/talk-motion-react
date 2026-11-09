import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Select, Space, Tooltip } from "antd";
import {
  BorderOuterOutlined,
  CompressOutlined,
  ExpandOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import useSignerSync from "./useSignerSync";
import { findCueIndexAt } from "../captions/cueOps";

const LAYOUT_KEY = "tm_signer_layout";
const SIZES = { s: 22, m: 32, l: 44 }; // % of the video's width
const CORNERS = ["br", "bl", "tl", "tr"];

function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || "{}");
    return {
      visible: saved.visible !== false,
      size: SIZES[saved.size] ? saved.size : "m",
      corner: CORNERS.includes(saved.corner) ? saved.corner : "br",
      pos: saved.pos && Number.isFinite(saved.pos.x) && Number.isFinite(saved.pos.y) ? saved.pos : null,
      captions: saved.captions !== false,
    };
  } catch {
    return { visible: true, size: "m", corner: "br", pos: null, captions: true };
  }
}

function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // per-viewer convenience only
  }
}

/**
 * YouTube video with the recorded signer picture-in-picture and text captions on top.
 * The signer can be hidden, resized, dragged or snapped to a corner; captions can be turned off
 * or switched to another language. Fullscreen covers the whole player, overlays included.
 */
export default function SubtitledVideoPlayer({ videoId, shots, captions }) {
  const { t } = useTranslation();
  const wrapRef = useRef(null);
  const sync = useSignerSync({ videoId, shots });
  const [layout, setLayout] = useState(loadLayout);
  const [fullscreen, setFullscreen] = useState(false);
  const [language, setLanguage] = useState(captions?.[0]?.language || null);
  const drag = useRef(null);

  useEffect(() => saveLayout(layout), [layout]);
  useEffect(() => {
    if (!captions?.some((c) => c.language === language)) setLanguage(captions?.[0]?.language || null);
  }, [captions, language]);

  // Esc or the browser's own controls can leave fullscreen; follow them.
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
  };

  const track = captions?.find((c) => c.language === language) || null;
  const cueIndex = layout.captions && track ? findCueIndexAt(track.cues, Math.round(sync.time * 1000)) : -1;
  const cue = cueIndex >= 0 ? track.cues[cueIndex] : null;

  // Drag the signer anywhere over the video (pointer events: mouse, touch and pen).
  const onPointerDown = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const box = wrapRef.current?.getBoundingClientRect();
    const el = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    drag.current = { dx: event.clientX - el.left, dy: event.clientY - el.top, box, w: el.width, h: el.height, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.min(Math.max(0, event.clientX - d.box.left - d.dx), d.box.width - d.w);
    const y = Math.min(Math.max(0, event.clientY - d.box.top - d.dy), d.box.height - d.h);
    d.moved = true;
    setLayout((l) => ({ ...l, pos: { x: (x / d.box.width) * 100, y: (y / d.box.height) * 100 } }));
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const signerStyle = layout.pos
    ? { width: `${SIZES[layout.size]}%`, left: `${layout.pos.x}%`, top: `${layout.pos.y}%` }
    : { width: `${SIZES[layout.size]}%` };

  if (!videoId) {
    return <Alert type="error" showIcon message={t("subtitles.viewer.noVideo", "This recording has no YouTube video.")} />;
  }

  return (
    <div className={`tm-viewer ${fullscreen ? "is-fullscreen" : ""}`} ref={wrapRef}>
      <div className="tm-viewer-stage">
        <div className="tm-viewer-player" ref={sync.containerRef} />
        {sync.error && (
          <div className="tm-sub-player-error" role="alert">
            <strong>{t("subtitles.playerError", "The video can't play")}</strong>
            <span>{sync.error}</span>
          </div>
        )}

        {shots.length > 0 && (
          <div
            className={`tm-viewer-signer ${layout.pos ? "" : `is-${layout.corner}`} ${layout.visible && sync.activeShotId ? "" : "is-hidden"}`}
            style={signerStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="group"
            aria-label={t("subtitles.viewer.signer", "Sign-language interpreter (drag to move)")}
          >
            <video ref={sync.signerRef} muted playsInline preload="auto" onError={sync.onSignerError} className="tm-viewer-signer-video" />
            {sync.needsTap && (
              <button type="button" className="tm-viewer-tap" onClick={sync.tapToPlay}>
                {t("subtitles.viewer.tap", "Tap to show the signer")}
              </button>
            )}
          </div>
        )}
        <video ref={sync.prefetchRef} muted preload="auto" className="tm-viewer-prefetch" aria-hidden />

        {cue && (
          <div className="tm-viewer-caption" aria-live="off">
            <span>{cue.text}</span>
          </div>
        )}
      </div>

      <div className="tm-viewer-toolbar" role="toolbar" aria-label={t("subtitles.viewer.toolbar", "Player options")}>
        <Space wrap size={4}>
          {shots.length > 0 && (
            <>
              <Tooltip title={layout.visible ? t("subtitles.viewer.hideSigner", "Hide the signer") : t("subtitles.viewer.showSigner", "Show the signer")}>
                <Button
                  size="small"
                  icon={layout.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  aria-pressed={layout.visible}
                  onClick={() => setLayout((l) => ({ ...l, visible: !l.visible }))}
                >
                  {t("subtitles.viewer.signerBtn", "Signer")}
                </Button>
              </Tooltip>
              <Select
                size="small"
                value={layout.size}
                onChange={(size) => setLayout((l) => ({ ...l, size }))}
                options={[
                  { value: "s", label: t("subtitles.viewer.small", "Small") },
                  { value: "m", label: t("subtitles.viewer.medium", "Medium") },
                  { value: "l", label: t("subtitles.viewer.large", "Large") },
                ]}
                aria-label={t("subtitles.viewer.size", "Signer size")}
                className="tm-viewer-select"
              />
              <Tooltip title={t("subtitles.viewer.corner", "Move the signer to the next corner")}>
                <Button
                  size="small"
                  icon={<BorderOuterOutlined />}
                  onClick={() =>
                    setLayout((l) => ({ ...l, pos: null, corner: CORNERS[(CORNERS.indexOf(l.corner) + 1) % CORNERS.length] }))
                  }
                  aria-label={t("subtitles.viewer.corner", "Move the signer to the next corner")}
                />
              </Tooltip>
            </>
          )}
          {captions?.length > 0 && (
            <>
              <Button
                size="small"
                icon={<FontSizeOutlined />}
                aria-pressed={layout.captions}
                onClick={() => setLayout((l) => ({ ...l, captions: !l.captions }))}
              >
                {layout.captions ? t("subtitles.viewer.ccOn", "Captions on") : t("subtitles.viewer.ccOff", "Captions off")}
              </Button>
              {captions.length > 1 && (
                <Select
                  size="small"
                  value={language}
                  onChange={setLanguage}
                  options={captions.map((c) => ({ value: c.language, label: c.label || c.language }))}
                  aria-label={t("subtitles.viewer.ccLanguage", "Caption language")}
                  className="tm-viewer-select"
                />
              )}
            </>
          )}
        </Space>
        <Button
          size="small"
          icon={fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? t("subtitles.viewer.exitFull", "Exit full screen") : t("subtitles.viewer.full", "Full screen")}
        >
          {fullscreen ? t("subtitles.viewer.exitFull", "Exit full screen") : t("subtitles.viewer.full", "Full screen")}
        </Button>
      </div>

      {sync.signerError && <Alert className="tm-sub-gap" type="warning" showIcon message={t("subtitles.viewer.signerError", sync.signerError)} />}
      {shots.length === 0 && (
        <Alert
          className="tm-sub-gap"
          type="info"
          showIcon
          message={t("subtitles.viewer.noSegments", "There's no signing in this recording yet.")}
          description={captions?.length ? t("subtitles.viewer.captionsOnly", "Text captions are shown.") : undefined}
        />
      )}
    </div>
  );
}

SubtitledVideoPlayer.propTypes = {
  videoId: PropTypes.string,
  shots: PropTypes.array.isRequired,
  captions: PropTypes.array,
};
