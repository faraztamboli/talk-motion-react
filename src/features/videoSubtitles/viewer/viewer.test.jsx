import "../testI18n";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const yt = vi.hoisted(() => ({ instances: [], time: 0, rate: 1 }));
vi.mock("../YouTubePlayerController", () => {
  class FakeController {
    constructor(container, options) {
      this.options = options;
      yt.instances.push(this);
    }
    load() {
      return Promise.resolve("vid");
    }
    getCurrentTime() {
      return yt.time;
    }
    getPlaybackRate() {
      return yt.rate;
    }
    seekTo(s) {
      yt.time = s;
    }
    destroy() {
      this.destroyed = true;
    }
  }
  return { YouTubePlayerController: FakeController, YT_STATE: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
});

const details = vi.hoisted(() => ({ result: null, setPrivacy: null }));
vi.mock("../recordingsApi", () => ({
  useGetRecordingDetailsQuery: () => details.result,
  useSetRecordingPrivacyMutation: () => [details.setPrivacy, { isLoading: false }],
}));

import useSignerSync from "./useSignerSync";
import SubtitledVideoPlayer from "./SubtitledVideoPlayer";
import RecordingViewer from "./RecordingViewer";

const SHOTS = [
  { id: "1", startTime: 0, endTime: 10, videoUrl: "https://v/1.mp4" },
  { id: "2", startTime: 20, endTime: 30, videoUrl: "https://v/2.mp4" },
];

function fakeVideo(v = document.createElement("video")) {
  let paused = true;
  let current = 0;
  Object.defineProperty(v, "paused", { get: () => paused });
  Object.defineProperty(v, "readyState", { get: () => 4, configurable: true });
  Object.defineProperty(v, "currentTime", { get: () => current, set: (x) => { current = x; } });
  v.play = vi.fn(() => {
    paused = false;
    return Promise.resolve();
  });
  v.pause = vi.fn(() => {
    paused = true;
  });
  v.load = vi.fn(() => v.dispatchEvent(new Event("loadedmetadata")));
  return v;
}

beforeEach(() => {
  yt.instances = [];
  yt.time = 0;
  yt.rate = 1;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function setup(shots = SHOTS) {
  const hook = { result: { current: null } };
  function Harness() {
    const api = useSignerSync({ videoId: "dQw4w9WgXcQ", shots });
    hook.result.current = api;
    return (
      <div>
        <div ref={api.containerRef} />
        <video ref={api.signerRef} />
        <video ref={api.prefetchRef} />
      </div>
    );
  }
  render(<Harness />);
  await act(async () => {});
  const signer = fakeVideo(hook.result.current.signerRef.current);
  return { hook, signer };
}

describe("useSignerSync", () => {
  it("plays the right segment when YouTube plays and pauses it when YouTube pauses", async () => {
    const { hook, signer } = await setup();
    // The player effect needs the container on first run; trigger it via a videoId-only remount.
    const controller = yt.instances.at(-1) || null;
    expect(controller).not.toBeNull();
    yt.time = 3;
    await act(async () => {
      controller.options.onStateChange({ data: 1 });
    });
    expect(signer.src).toBe("https://v/1.mp4");
    expect(signer.currentTime).toBe(3);
    expect(signer.play).toHaveBeenCalled();
    expect(hook.result.current.activeShotId).toBe("1");

    await act(async () => {
      controller.options.onStateChange({ data: 2 });
    });
    expect(signer.pause).toHaveBeenCalled();

    // resume inside the same segment: the signer plays again (the old freeze)
    signer.play.mockClear();
    yt.time = 4;
    await act(async () => {
      controller.options.onStateChange({ data: 1 });
    });
    expect(signer.play).toHaveBeenCalled();
  });

  it("switches segments by id, corrects only real drift, and goes quiet between segments", async () => {
    const { hook, signer } = await setup();
    const controller = yt.instances.at(-1);
    yt.time = 1;
    await act(async () => controller.options.onStateChange({ data: 1 }));
    signer.currentTime = 1.2; // within tolerance
    yt.time = 1.3;
    await act(async () => vi.advanceTimersByTime(200));
    expect(signer.currentTime).toBe(1.2);
    yt.time = 5; // signer far behind
    await act(async () => vi.advanceTimersByTime(200));
    expect(signer.currentTime).toBe(5);
    yt.time = 15; // gap
    await act(async () => vi.advanceTimersByTime(200));
    expect(hook.result.current.activeShotId).toBeNull();
    yt.time = 22;
    await act(async () => vi.advanceTimersByTime(200));
    expect(signer.src).toBe("https://v/2.mp4");
    expect(signer.currentTime).toBe(2);
  });

  it("asks for a tap when the browser refuses to play", async () => {
    const { hook, signer } = await setup();
    signer.play = vi.fn(() => Promise.reject(Object.assign(new Error("no"), { name: "NotAllowedError" })));
    const controller = yt.instances.at(-1);
    yt.time = 2;
    await act(async () => controller.options.onStateChange({ data: 1 }));
    await act(async () => {});
    expect(hook.result.current.needsTap).toBe(true);
  });

  it("follows the playback rate", async () => {
    const { signer } = await setup();
    const controller = yt.instances.at(-1);
    await act(async () => controller.options.onPlaybackRateChange({ data: 1.5 }));
    expect(signer.playbackRate).toBe(1.5);
  });
});

describe("SubtitledVideoPlayer", () => {
  it("shows captions, lets the viewer hide them and the signer, and remembers it", async () => {
    vi.useRealTimers();
    const captions = [{ id: "1", language: "en", label: "English", cues: [{ id: "a", startMs: 0, endMs: 60000, text: "Hello there" }] }];
    render(<SubtitledVideoPlayer videoId="dQw4w9WgXcQ" shots={SHOTS} captions={captions} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /captions on/i }));
    expect(screen.queryByText("Hello there")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /signer/i, pressed: true }));
    expect(JSON.parse(localStorage.getItem("tm_signer_layout"))).toMatchObject({ visible: false, captions: false });
  });

  it("says when there is no signing yet", () => {
    vi.useRealTimers();
    render(<SubtitledVideoPlayer videoId="dQw4w9WgXcQ" shots={[]} captions={[]} />);
    expect(screen.getByText(/no signing in this recording yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /signer/i })).not.toBeInTheDocument();
  });

  it("explains a recording without a YouTube video", () => {
    vi.useRealTimers();
    render(<SubtitledVideoPlayer videoId={null} shots={[]} captions={[]} />);
    expect(screen.getByText(/no youtube video/i)).toBeInTheDocument();
  });
});

describe("RecordingViewer", () => {
  const renderViewer = () =>
    render(
      <MemoryRouter initialEntries={["/video-subtitles/library/7"]}>
        <Routes>
          <Route path="/video-subtitles/library/:recordingId" element={<RecordingViewer />} />
        </Routes>
      </MemoryRouter>
    );

  const recording = (overrides = {}) => ({
    id: "7",
    title: "Storytime in ASL",
    description: "",
    videoId: "dQw4w9WgXcQ",
    isPublic: false,
    owner: "ann",
    creator: { username: "ann", fullname: "Ann A" },
    youtubeAuthor: "Library",
    ...overrides,
  });

  beforeEach(() => {
    vi.useRealTimers();
    details.setPrivacy = vi.fn(async () => ({ data: {} }));
  });

  it("explains a recording that isn't available", () => {
    details.result = { error: { code: "not_found", message: "x" }, isLoading: false, refetch: vi.fn() };
    renderViewer();
    expect(screen.getByText(/isn't available/i)).toBeInTheDocument();
  });

  it("offers a retry when loading failed", () => {
    const refetch = vi.fn();
    details.result = { error: { code: "timeout", message: "slow" }, isLoading: false, refetch };
    renderViewer();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows owners the real privacy state and an edit button", () => {
    details.result = { data: { recording: recording({ isPublic: true }), playable: SHOTS, captions: [], canEdit: true }, isLoading: false };
    renderViewer();
    expect(screen.getByRole("heading", { name: "Storytime in ASL" })).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("hides owner controls from everyone else", () => {
    details.result = { data: { recording: recording(), playable: SHOTS, captions: [], canEdit: false }, isLoading: false };
    renderViewer();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.getByText("Ann A")).toBeInTheDocument();
  });
});
