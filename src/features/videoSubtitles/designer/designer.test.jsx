import "../testI18n";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CandidatePanel from "./CandidatePanel";
import CameraPanel from "./CameraPanel";
import SegmentList from "./SegmentList";
import VideoChooser from "./VideoChooser";

const mocks = vi.hoisted(() => ({ session: null, camera: null, details: null }));
vi.mock("./useDesignerSession", () => ({ default: () => mocks.session }));
vi.mock("../useRecorderCamera", () => ({ default: () => mocks.camera }));
vi.mock("../recordingsApi", () => ({
  useGetRecordingDetailsQuery: () => ({ data: mocks.details, refetch: vi.fn() }),
  useDeleteShotMutation: () => [vi.fn(async () => ({ data: {} }))],
  useSetRecordingDetailsMutation: () => [vi.fn(async () => ({ data: {} })), { isLoading: false }],
  useSetRecordingPrivacyMutation: () => [vi.fn(async () => ({ data: {} })), { isLoading: false }],
  useSaveCaptionsMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteCaptionsMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock("../../../components/ui/AIContentGenerator", () => ({ default: () => <div>AI</div> }));
import SubtitleDesigner from "./SubtitleDesigner";

afterEach(() => {
  vi.useRealTimers();
});

const camera = (overrides = {}) => ({
  videoRef: { current: null },
  stream: null,
  status: "off",
  error: null,
  devices: [],
  deviceId: null,
  selectDevice: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("CandidatePanel", () => {
  it("says it is checking, then explains a video that can't be used", () => {
    const { rerender } = render(<CandidatePanel candidate={{ videoId: "a", status: "checking" }} onCommit={vi.fn()} />);
    expect(screen.getByText(/checking the video/i)).toBeInTheDocument();
    rerender(<CandidatePanel candidate={{ videoId: "a", status: "error", error: "The owner doesn't allow it." }} onCommit={vi.fn()} />);
    expect(screen.getByText(/can't be used/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn't allow it/)).toBeInTheDocument();
  });

  it("prefills the title from YouTube and commits the author's values", () => {
    const onCommit = vi.fn();
    render(<CandidatePanel candidate={{ videoId: "a", status: "ready", meta: { title: "Storytime", author: "Ann" } }} onCommit={onCommit} />);
    const title = screen.getByLabelText(/title of your recording/i);
    expect(title).toHaveValue("Storytime");
    fireEvent.change(title, { target: { value: "My ASL storytime" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "For kids" } });
    fireEvent.click(screen.getByRole("button", { name: /use this video/i }));
    expect(onCommit).toHaveBeenCalledWith({ title: "My ASL storytime", description: "For kids" });
  });

  it("won't commit without a title", () => {
    render(<CandidatePanel candidate={{ videoId: "a", status: "ready", meta: {} }} onCommit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /use this video/i })).toBeDisabled();
  });
});

describe("CameraPanel", () => {
  const base = { engineState: "idle", onArm: vi.fn(), onDisarm: vi.fn() };

  it("keeps the camera off until asked", () => {
    const cam = camera();
    render(<CameraPanel {...base} camera={cam} canRecord={false} />);
    fireEvent.click(screen.getByRole("button", { name: /turn on camera/i }));
    expect(cam.start).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /turn recording on/i })).toBeDisabled();
  });

  it("explains a camera problem with a retry", () => {
    const cam = camera({ status: "error", error: { message: "Camera access is blocked." } });
    render(<CameraPanel {...base} camera={cam} canRecord={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Camera access is blocked.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(cam.start).toHaveBeenCalled();
  });

  it("arms, shows recording state and pending uploads", () => {
    const onArm = vi.fn();
    const { rerender } = render(<CameraPanel {...base} onArm={onArm} camera={camera({ status: "on" })} engineState="ready" canRecord />);
    fireEvent.click(screen.getByRole("button", { name: /turn recording on/i }));
    expect(onArm).toHaveBeenCalled();
    rerender(<CameraPanel {...base} camera={camera({ status: "on" })} engineState="recording" isArmed canRecord pendingUploads={2} />);
    expect(screen.getByText("REC")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop recording/i })).toBeEnabled();
    // (tests run without an i18next instance, so {{count}} isn't interpolated here)
    expect(screen.getByText(/keep this page open/i)).toBeInTheDocument();
  });
});

describe("SegmentList", () => {
  const handlers = { onSeek: vi.fn(), onRetry: vi.fn(), onRemove: vi.fn(), onRemoveServerShot: vi.fn() };

  it("shows an empty state", () => {
    render(<SegmentList segments={[]} serverShots={[]} {...handlers} />);
    expect(screen.getByText(/no segments yet/i)).toBeInTheDocument();
  });

  it("lists server and local segments in time order with their status", () => {
    render(
      <SegmentList
        {...handlers}
        duration={100}
        serverShots={[{ id: "9", startTime: 30, endTime: 40, status: "complete", videoUrl: "u" }]}
        segments={[
          { localId: 1, shotId: "11", start: 5, end: 9, status: "saved", videoUrl: "v" },
          { localId: 2, shotId: null, start: 50, end: 55, status: "failed", error: "finalize failed", blob: {} },
        ]}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText(/0:05.0 – 0:09.0/)).toBeInTheDocument();
    expect(within(items[1]).getByText("Saved")).toBeInTheDocument();
    expect(within(items[2]).getByText("Upload failed")).toBeInTheDocument();
    expect(within(items[2]).getByText("finalize failed")).toBeInTheDocument();
    fireEvent.click(within(items[2]).getByRole("button", { name: /upload again/i }));
    expect(handlers.onRetry).toHaveBeenCalledWith(2);
    fireEvent.click(within(items[1]).getByRole("button", { name: /play the video from here/i }));
    expect(handlers.onSeek).toHaveBeenCalledWith(30);
  });

  it("asks before deleting and deletes server segments on the server", async () => {
    render(<SegmentList {...handlers} serverShots={[{ id: "9", startTime: 1, endTime: 2, status: "complete", videoUrl: "u" }]} segments={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /delete segment/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^delete$/i }));
    expect(handlers.onRemoveServerShot).toHaveBeenCalledWith("9");
  });

  it("can't delete a segment that is uploading", () => {
    render(<SegmentList {...handlers} serverShots={[]} segments={[{ localId: 3, start: 1, end: 2, status: "uploading", progress: 0.4 }]} />);
    expect(screen.getByRole("button", { name: /delete segment/i })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("VideoChooser", () => {
  it("checks a pasted link once, after typing stops", () => {
    vi.useFakeTimers();
    const onChoose = vi.fn();
    render(<VideoChooser onChoose={onChoose} />);
    fireEvent.click(screen.getByRole("tab", { name: /paste a link/i }));
    const input = screen.getByLabelText(/youtube video link/i);
    fireEvent.change(input, { target: { value: "https://youtu.be/dQw4w9WgXcQ" } });
    act(() => vi.advanceTimersByTime(500));
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith("https://youtu.be/dQw4w9WgXcQ", {});
    fireEvent.change(input, { target: { value: "not a link" } });
    act(() => vi.advanceTimersByTime(500));
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/doesn't look like a youtube video link/i)).toBeInTheDocument();
  });
});

describe("SubtitleDesigner", () => {
  const session = (overrides = {}) => ({
    playerContainerRef: { current: null },
    candidate: null,
    recording: null,
    player: { ready: false, error: null, time: 0, duration: 0, playing: false },
    engineState: "idle",
    segments: [],
    isArmed: false,
    canRecord: false,
    notice: null,
    dismissNotice: vi.fn(),
    loadingExisting: false,
    creating: false,
    checkVideo: vi.fn(),
    commitVideo: vi.fn(async () => ({ id: "7", videoId: "dQw4w9WgXcQ" })),
    changeVideo: vi.fn(),
    arm: vi.fn(),
    disarm: vi.fn(),
    retry: vi.fn(),
    removeSegment: vi.fn(),
    seekTo: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    currentTimeMs: () => 0,
    hasPendingWork: () => false,
    ...overrides,
  });

  const renderAt = (path = "/video-subtitles/designer") => {
    const store = configureStore({ reducer: { apiAuth: () => ({ status: "authenticated" }) } });
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/video-subtitles/designer" element={<SubtitleDesigner />} />
            <Route path="/video-subtitles/designer/:recordingId" element={<SubtitleDesigner />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  it("starts by finding a video", () => {
    mocks.session = session();
    mocks.camera = camera();
    mocks.details = null;
    renderAt();
    expect(screen.getByText(/find a youtube video/i)).toBeInTheDocument();
    expect(screen.queryByText(/sign-language segments/i)).not.toBeInTheDocument();
  });

  it("offers the chosen video, then moves to recording after committing", async () => {
    mocks.session = session({ candidate: { videoId: "dQw4w9WgXcQ", status: "ready", meta: { title: "T" } } });
    mocks.camera = camera();
    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /use this video/i }));
    await act(async () => {});
    expect(mocks.session.commitVideo).toHaveBeenCalledWith({ title: "T", description: "" });
  });

  it("opens an existing recording on the record step with segments and captions tabs", () => {
    mocks.session = session({
      candidate: { videoId: "dQw4w9WgXcQ", status: "ready", meta: {} },
      recording: { id: "7", videoId: "dQw4w9WgXcQ" },
    });
    mocks.camera = camera();
    mocks.details = { shots: [], captions: [], captionsAvailable: true, recording: { isPublic: false } };
    renderAt("/video-subtitles/designer/7");
    expect(screen.getByRole("tab", { name: /sign-language segments/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /text captions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /turn on camera/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next: review and publish/i }));
    expect(screen.getByText(/who can watch/i)).toBeInTheDocument();
  });

  it("tells non-owners they can only watch", () => {
    mocks.session = session({ recording: { id: "7", readOnly: true } });
    mocks.camera = camera();
    renderAt("/video-subtitles/designer/7");
    expect(screen.getByText(/only the person who made this recording can edit it/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/video-subtitles/library/7");
  });

  it("shows notices until dismissed", () => {
    mocks.session = session({ notice: { type: "error", message: "A segment couldn't be uploaded: boom" } });
    mocks.camera = camera();
    renderAt();
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});
