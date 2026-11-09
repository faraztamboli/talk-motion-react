import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Segmented, Space, Typography } from "antd";
import { PauseOutlined, CaretRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { HAND_CONNECTIONS, POSE_CONNECTIONS, drawConnections, drawPoints } from "../../utils/landmarkConnections";

const toPoints = (arr) => (Array.isArray(arr) ? arr.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1], z: p[2] } : p)) : null);

/**
 * Normalize frames from a live take ({ t, data: { leftHandLandmarks, ... } }) or a stored sample
 * ({ t, lh, rh, pose } with [x, y, z] triples) to { t, left, right, pose } with t from 0 ms.
 */
export function normalizeReplayFrames(frames = []) {
  if (!frames.length) return [];
  const t0 = frames[0].t ?? 0;
  return frames.map((f, i) => {
    const d = f.data || {};
    return {
      t: Number.isFinite(f.t) ? f.t - t0 : i * 33,
      left: toPoints(d.leftHandLandmarks || f.lh),
      right: toPoints(d.rightHandLandmarks || f.rh),
      pose: toPoints(d.poseLandmarks || f.pose),
    };
  });
}

function draw(ctx, w, h, frame) {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);
  if (!frame) return;
  drawConnections(ctx, frame.pose, POSE_CONNECTIONS, { color: "rgba(255,255,255,0.35)", lineWidth: 2 });
  if (frame.right) {
    drawConnections(ctx, frame.right, HAND_CONNECTIONS, { color: "rgb(0,217,231)", lineWidth: 2 });
    drawPoints(ctx, frame.right, { color: "white", fillColor: "rgb(0,217,231)", radius: 3 });
  }
  if (frame.left) {
    drawConnections(ctx, frame.left, HAND_CONNECTIONS, { color: "rgb(255,138,0)", lineWidth: 2 });
    drawPoints(ctx, frame.left, { color: "white", fillColor: "rgb(255,138,0)", radius: 3 });
  }
}

/** Loops a take as a skeleton animation at its real speed (or slower). */
export default function SampleReplay({ frames, autoPlay = true, compact = false, label }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const data = useMemo(() => normalizeReplayFrames(frames), [frames]);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    if (!playing || data.length < 2) {
      draw(ctx, canvas.width, canvas.height, data[index] || data[0]);
      return undefined;
    }
    const duration = data[data.length - 1].t + 33;
    let raf;
    let start = performance.now() - (data[index]?.t || 0) / speed;
    const loop = (now) => {
      const at = ((now - start) * speed) % duration;
      let i = 0;
      while (i < data.length - 1 && data[i + 1].t <= at) i += 1;
      draw(ctx, canvas.width, canvas.height, data[i]);
      setIndex((prev) => (prev === i ? prev : i));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // index is read only to resume where playback stopped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, playing, speed]);

  const seconds = data.length > 1 ? (data[data.length - 1].t / 1000).toFixed(1) : "0.0";

  return (
    <div className={`tm-replay ${compact ? "tm-replay-compact" : ""}`}>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="tm-replay-canvas"
        role="img"
        aria-label={label || t("models.replay.label", "Skeleton replay of the take")}
      />
      {!compact && (
        <Space className="tm-replay-controls" wrap>
          <Button
            size="small"
            icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t("models.replay.pause", "Pause replay") : t("models.replay.play", "Play replay")}
          />
          <Segmented
            size="small"
            value={speed}
            onChange={setSpeed}
            options={[
              { label: "1×", value: 1 },
              { label: "½×", value: 0.5 },
              { label: "¼×", value: 0.25 },
            ]}
            aria-label={t("models.replay.speed", "Replay speed")}
          />
          <Typography.Text type="secondary">
            {t("models.replay.meta", "{{frames}} frames · {{seconds}} s", { frames: data.length, seconds })}
          </Typography.Text>
        </Space>
      )}
    </div>
  );
}

SampleReplay.propTypes = {
  frames: PropTypes.array,
  autoPlay: PropTypes.bool,
  compact: PropTypes.bool,
  label: PropTypes.string,
};
