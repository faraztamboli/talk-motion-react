import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { FACE_SUBSET, hasHands, slimResults, toLegacyResults } from "./landmarkMath";
import useLandmarker, { describeCameraError } from "./useLandmarker";
import LandmarkerView from "./LandmarkerView";

vi.mock("./engine", () => ({ loadEngine: vi.fn() }));
import { loadEngine } from "./engine";

const pt = (x, y = 0.5, z = 0) => ({ x, y, z });

describe("toLegacyResults", () => {
  it("mirrors x and swaps hands so stored samples keep the selfie-mode convention", () => {
    const result = {
      leftHandLandmarks: [[pt(0.2)]],
      rightHandLandmarks: [[pt(0.7)]],
    };
    const legacy = toLegacyResults(result);
    expect(legacy.leftHandLandmarks[0].x).toBeCloseTo(0.3); // from Tasks right hand
    expect(legacy.rightHandLandmarks[0].x).toBeCloseTo(0.8); // from Tasks left hand
  });

  it("swaps paired pose points after flipping", () => {
    const pose = Array.from({ length: 33 }, (_, i) => pt(i / 100));
    const legacy = toLegacyResults({ poseLandmarks: [pose] });
    expect(legacy.poseLandmarks[11].x).toBeCloseTo(1 - 0.12);
    expect(legacy.poseLandmarks[12].x).toBeCloseTo(1 - 0.11);
    expect(legacy.poseLandmarks[0].x).toBeCloseTo(1);
  });

  it("omits parts that were not detected", () => {
    expect(toLegacyResults({ leftHandLandmarks: [], poseLandmarks: [] })).toEqual({});
  });
});

describe("slimResults", () => {
  it("rounds to 4 decimals and keeps only the face subset", () => {
    const face = Array.from({ length: 468 }, () => pt(0.123456789));
    const slim = slimResults({ faceLandmarks: face, rightHandLandmarks: [{ x: 0.111119, y: 0, z: 0 }] });
    expect(slim.rightHandLandmarks[0].x).toBe(0.1111);
    expect(slim.faceLandmarks).toHaveLength(468);
    const kept = slim.faceLandmarks.filter(Boolean).length;
    expect(kept).toBe(FACE_SUBSET.size);
    expect(slim.faceLandmarks[61]).toEqual({ x: 0.1235, y: 0.5, z: 0 });
    expect(slim.faceLandmarks[1]).toBeNull();
  });

  it("keeps pose visibility", () => {
    const slim = slimResults({ poseLandmarks: [{ x: 0.5, y: 0.5, z: 0, visibility: 0.987654 }] });
    expect(slim.poseLandmarks[0].visibility).toBe(0.9877);
  });

  it("hasHands", () => {
    expect(hasHands({ leftHandLandmarks: [] })).toBe(true);
    expect(hasHands({ poseLandmarks: [] })).toBe(false);
  });
});

describe("describeCameraError", () => {
  it.each([
    ["NotAllowedError", "camera-denied"],
    ["SecurityError", "camera-denied"],
    ["NotFoundError", "camera-missing"],
    ["OverconstrainedError", "camera-missing"],
    ["NotReadableError", "camera-in-use"],
    ["TypeError", "unsupported"],
  ])("%s -> %s", (name, code) => {
    expect(describeCameraError({ name }).code).toBe(code);
  });
});

describe("useLandmarker", () => {
  let track;
  let rafCallbacks;

  beforeEach(() => {
    track = { stop: vi.fn() };
    rafCallbacks = [];
    vi.stubGlobal("requestAnimationFrame", (cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })),
        enumerateDevices: vi.fn(async () => []),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    HTMLMediaElement.prototype.play = vi.fn(async () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function withVideo(result) {
    const video = document.createElement("video");
    Object.defineProperty(video, "readyState", { value: 4 });
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 360 });
    let t = 0;
    Object.defineProperty(video, "currentTime", { get: () => (t += 1) });
    result.current.videoRef.current = video;
    return video;
  }

  it("opens the camera, loads the engine, and calls onFrame with the slim payload", async () => {
    const detectForVideo = vi.fn(() => ({ rightHandLandmarks: [[pt(0.4)]] }));
    loadEngine.mockResolvedValue({ landmarker: { detectForVideo }, delegate: "CPU" });
    const onFrame = vi.fn();
    const { result } = renderHook(() => useLandmarker({ onFrame, draw: false }));
    withVideo(result);

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("running");
    expect(result.current.delegate).toBe("CPU");

    act(() => rafCallbacks.shift()());
    expect(onFrame).toHaveBeenCalledTimes(1);
    const [frame, meta] = onFrame.mock.calls[0];
    expect(frame.leftHandLandmarks[0].x).toBeCloseTo(0.6);
    expect(meta.handsVisible).toBe(true);
    expect(result.current.handsVisible).toBe(true);
  });

  it("reports a denied camera with a way to retry, without loading frames", async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(Object.assign(new Error("no"), { name: "NotAllowedError" }));
    loadEngine.mockResolvedValue({ landmarker: { detectForVideo: vi.fn() }, delegate: "GPU" });
    const { result } = renderHook(() => useLandmarker({ draw: false }));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error.code).toBe("camera-denied");
  });

  it("reports an engine failure and releases the camera", async () => {
    loadEngine.mockRejectedValue(new Error("wasm 404"));
    const { result } = renderHook(() => useLandmarker({ draw: false }));
    withVideo(result);
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error.code).toBe("engine-failed");
    expect(track.stop).toHaveBeenCalled();
  });

  it("stops the camera on unmount, even mid-start", async () => {
    let resolveEngine;
    loadEngine.mockReturnValue(new Promise((r) => (resolveEngine = r)));
    const onFrame = vi.fn();
    const { result, unmount } = renderHook(() => useLandmarker({ onFrame, draw: false }));
    withVideo(result);
    let started;
    await act(async () => {
      started = result.current.start();
      await Promise.resolve();
    });
    unmount();
    resolveEngine({ landmarker: { detectForVideo: vi.fn(() => ({})) }, delegate: "GPU" });
    await expect(started).resolves.toBe(false);
    expect(track.stop).toHaveBeenCalled();
    expect(rafCallbacks).toHaveLength(0);
  });
});

describe("LandmarkerView", () => {
  const base = {
    videoRef: { current: null },
    canvasRef: { current: null },
    handsVisible: false,
    devices: [],
    deviceId: null,
    selectDevice: vi.fn(),
    start: vi.fn(),
  };

  it("offers to turn the camera on when idle", () => {
    render(<LandmarkerView lm={{ ...base, status: "idle", error: null }} />);
    screen.getByRole("button", { name: /turn on camera/i }).click();
    expect(base.start).toHaveBeenCalled();
  });

  it("shows the error with a retry", () => {
    render(
      <LandmarkerView lm={{ ...base, status: "error", error: { code: "camera-denied", message: "Camera access is blocked." } }} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Camera access is blocked.");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("asks for hands while running without them", () => {
    render(<LandmarkerView lm={{ ...base, status: "running", error: null }} />);
    expect(screen.getAllByText(/show your hands/i).length).toBeGreaterThan(0);
  });
});
