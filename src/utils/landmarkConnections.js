/**
 * Landmark topology + tiny canvas helpers, replacing the legacy
 * @mediapipe/drawing_utils CDN globals (window.drawConnectors etc.).
 */

// MediaPipe 21-point hand topology
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];

// MediaPipe 33-point pose topology (upper body + legs)
export const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
];

export function drawConnections(ctx, landmarks, connections, { color = "white", lineWidth = 2 } = {}) {
  if (!landmarks) return;
  const { width, height } = ctx.canvas;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (const [a, b] of connections) {
    const p = landmarks[a];
    const q = landmarks[b];
    if (!p || !q) continue;
    ctx.moveTo(p.x * width, p.y * height);
    ctx.lineTo(q.x * width, q.y * height);
  }
  ctx.stroke();
}

export function drawPoints(ctx, landmarks, { color = "white", fillColor = "white", radius = 3 } = {}) {
  if (!landmarks) return;
  const { width, height } = ctx.canvas;
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 1;
  for (const p of landmarks) {
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}
