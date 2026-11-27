import { describe, expect, it } from "vitest";
import { fitFrame, toScene } from "./AvatarStage";

const poseWith = (points) => {
  const pose = Array.from({ length: 33 }, () => [0, 0, 0]);
  for (const [i, p] of Object.entries(points)) pose[i] = p;
  return pose;
};

describe("skeleton framing", () => {
  it("draws the shoulders centred and the same width, near or far from the camera", () => {
    const near = poseWith({ 11: [0.9, 0.7, 0], 12: [0.1, 0.7, 0] });
    const far = poseWith({ 11: [0.6, 0.3, 0], 12: [0.4, 0.3, 0] });
    for (const pose of [near, far]) {
      const fit = fitFrame(pose, null);
      const l = toScene(pose[11], fit);
      const r = toScene(pose[12], fit);
      expect(l.x - r.x).toBeCloseTo(0.8);
      expect(l.x + r.x).toBeCloseTo(0);
      expect(l.y).toBeCloseTo(r.y);
    }
  });

  it("leaves MediaPipe's body depth out, but keeps the hand's own", () => {
    const fit = fitFrame(poseWith({ 11: [0.7, 0.5, 0], 12: [0.3, 0.5, 0] }), null);
    expect(toScene([0.5, 0.5, -1.4], fit, 0).z).toBeCloseTo(0);
    expect(toScene([0.5, 0.5, -0.05], fit, 1).z).toBeGreaterThan(0);
  });

  it("keeps the last framing when the shoulders are not tracked, and follows them smoothly", () => {
    const first = fitFrame(poseWith({ 11: [0.7, 0.5, 0], 12: [0.3, 0.5, 0] }), null);
    expect(fitFrame(poseWith({}), first)).toBe(first);
    const moved = fitFrame(poseWith({ 11: [0.9, 0.5, 0], 12: [0.5, 0.5, 0] }), first);
    expect(moved.cx).toBeGreaterThan(first.cx);
    expect(moved.cx).toBeLessThan(0.7);
  });

  it("falls back to the whole picture when no shoulders were ever seen", () => {
    const fit = fitFrame(poseWith({}), null);
    expect(toScene([0.5, 0.5, 0], fit).length()).toBeCloseTo(0);
  });
});
