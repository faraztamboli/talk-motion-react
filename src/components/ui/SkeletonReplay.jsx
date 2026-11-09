import React, { useEffect, useRef } from "react";
import {
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
  drawConnections,
  drawPoints,
} from "../../utils/landmarkConnections";

/**
 * Loops a recorded landmark sequence as a skeleton animation so the trainer
 * can judge the take before keeping it. Draws hands (connectors + points) and
 * the pose skeleton from the slim landmark frames buffered by
 * useCaptureWizard — no video is stored or replayed, only landmarks.
 */
export const SkeletonReplay = ({ frames, fps = 15, height = 400 }) => {
  const canvasRef = useRef(null);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frames || frames.length === 0) return undefined;
    const ctx = canvas.getContext("2d");

    frameIndexRef.current = 0;
    const timer = setInterval(() => {
      const frame = frames[frameIndexRef.current % frames.length];
      frameIndexRef.current += 1;
      const data = frame.data;

      ctx.save();
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawConnections(ctx, data.poseLandmarks, POSE_CONNECTIONS, {
        color: "rgba(255,255,255,0.3)",
        lineWidth: 2,
      });
      if (data.rightHandLandmarks) {
        drawConnections(ctx, data.rightHandLandmarks, HAND_CONNECTIONS, {
          color: "rgb(0,217,231)",
          lineWidth: 2,
        });
        drawPoints(ctx, data.rightHandLandmarks, {
          color: "white",
          fillColor: "rgb(0,217,231)",
          radius: 3,
        });
      }
      if (data.leftHandLandmarks) {
        drawConnections(ctx, data.leftHandLandmarks, HAND_CONNECTIONS, {
          color: "rgb(255,138,0)",
          lineWidth: 2,
        });
        drawPoints(ctx, data.leftHandLandmarks, {
          color: "white",
          fillColor: "rgb(255,138,0)",
          radius: 3,
        });
      }
      ctx.restore();
    }, 1000 / fps);

    return () => clearInterval(timer);
  }, [frames, fps]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        width: "100%",
        maxHeight: `${height}px`,
        objectFit: "contain",
        borderRadius: "var(--radius-md)",
        backgroundColor: "#111",
      }}
      aria-label="Replay of the recorded gesture as a skeleton animation"
      role="img"
    />
  );
};

export default SkeletonReplay;
