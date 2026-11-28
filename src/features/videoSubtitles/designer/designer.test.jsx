import "../testI18n";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CandidatePanel from "./CandidatePanel";
import VideoChooser from "./VideoChooser";
import TakeList from "./TakeList";
import Timeline from "./Timeline";
import RecordBar from "./RecordBar";
import { formatDuration, saveSummary, signedSeconds, takeRows } from "./takes";
import { playbackTakes } from "./useTakePlayback";

const mocks = vi.hoisted(() => ({ session: null, camera: null, details: null }));
vi.mock("./useDesignerSession", () => ({ default: () => mocks.session }));
vi.mock("../useRecorderCamera", () => ({ default: () => mocks.camera }));
vi.mock("../recordingsApi", () => ({
  useGetRecordingDetailsQuery: () => ({ data: mocks.details, refetch: vi.fn() }),
  useDeleteShotMutation: () => [vi.fn(async () => ({ data: {} }))],
  useSetRecordingDetailsMutation: () => [vi.fn(async () => ({ data: {} })), { isLoading: false }],
  useSetRecordingPrivacyMutation: () => [vi.fn(async () => ({ data: {} })), { isLoading: false }],
  useSaveCaptionsMutation: () => [vi.fn(async ({ cues }) => ({ data: { track: { cues }, adjusted: 0 } })), { isLoading: false }],
  useDeleteCaptionsMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock("../../autoCaptions/useAutoCaptions", () => ({
  default: () => ({ status: "idle", progress: 0, error: null, subtitles: [], run: vi.fn(), cancel: vi.fn(), reset: vi.fn() }),
}));
vi.mock("../viewer/SubtitledVideoPlayer", () => ({ default: ({ shots }) => <div data-testid="preview">preview with {shots.length} segment(s)</div> }));
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

// ------------------------------------------------------------------------- takes

const serverShot = (id, startTime, endTime, status = "complete", videoUrl = `https://v/${id}.mp4`) => ({ id: String(id), startTime, endTime, status, videoUrl });
const localSeg = (localId, start, end, status, extra = {}) => ({ localId, start, end, status, shotId: null, progress: 0, previewUrl: `blob:${localId}`, ...extra });

describe("takes", () => {
  it("merges server and local takes in video order; the local copy replaces its server row", () => {
    const rows = takeRows(
      [localSeg(1, 30, 40, "uploading", { shotId: "9", progress: 0.5 }), localSeg(2, 50, null, "recording", { previewUrl: null })],
      [serverShot(8, 0, 10), serverShot(9, 30, 40, "uploading", null), serverShot(10, 12, 15, "uploading", null)],
      55
    );
    expect(rows.map((r) => [r.number, r.key, r.status])).toEqual([
      [1, "server-8", "complete"],
      [2, "server-10", "interrupted"],
      [3, "local-1", "uploading"],
      [4, "local-2", "recording"],
    ]);
    expect(rows[3].end).toBe(55); // the take being recorded grows with the video
    expect(signedSeconds(rows)).toBe(10 + 10 + 5);
  });

  it("says in one line whether the work is safe", () => {
    expect(saveSummary([{ status: "saved" }]).tone).toBe("ok");
    expect(saveSummary([{ status: "uploading" }])).toEqual({ tone: "busy", text: "Saving your signing…" });
    expect(saveSummary([{ status: "processing" }]).text).toMatch(/preparing/i);
    expect(saveSummary([{ status: "failed" }, { status: "uploading" }])).toEqual({ tone: "error", text: "A take couldn't be saved" });
    expect(saveSummary([], { captionsSaving: true }).text).toMatch(/captions/i);
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("plays back local takes straight away, newest winning over the server copy", () => {
    const takes = playbackTakes(
      [localSeg(1, 30, 40, "uploading", { shotId: "9" }), localSeg(2, 5, 8, "queued"), localSeg(3, 50, 52, "discarded")],
      [serverShot(8, 0, 10), serverShot(9, 30, 40), serverShot(11, 60, 61, "processing", null)]
    );
    expect(takes.map((t) => [t.id, t.videoUrl])).toEqual([
      ["8", "https://v/8.mp4"],
      [String(1e12 + 2), "blob:2"],
      ["9", "blob:1"],
    ]);
  });
});

describe("TakeList", () => {
  const handlers = () => ({ onWatch: vi.fn(), onRerecord: vi.fn(), onRetry: vi.fn(), onRemove: vi.fn(), onSelect: vi.fn() });

  it("explains what to do when there are no takes", () => {
    render(<TakeList rows={[]} {...handlers()} />);
    expect(screen.getByText(/no signing yet/i)).toBeInTheDocument();
    expect(screen.getByText(/press record/i)).toBeInTheDocument();
  });

  it("shows where each take stands, in plain words", () => {
    const rows = takeRows(
      [
        localSeg(1, 0, 52, "uploading", { progress: 0.4 }),
        localSeg(2, 60, 70, "processing", { shotId: "5" }),
        localSeg(3, 80, 90, "failed", { error: "Network down" }),
      ],
      [serverShot(4, 100, 110)]
    );
    render(<TakeList rows={rows} {...handlers()} />);
    expect(screen.getByText(/saving 40%/i)).toBeInTheDocument();
    expect(screen.getByText(/preparing video/i)).toBeInTheDocument();
    expect(screen.getByText(/couldn't save/i)).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("0:00 – 0:52")).toBeInTheDocument();
  });

  it("watches, redoes, retries and deletes (asking first)", async () => {
    const h = handlers();
    const rows = takeRows([localSeg(3, 80, 90, "failed", { error: "x" })], [serverShot(4, 100, 110)]);
    render(<TakeList rows={rows} {...h} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(h.onRetry).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getAllByRole("button", { name: /watch/i })[1]);
    expect(h.onWatch).toHaveBeenCalledWith(expect.objectContaining({ shotId: "4" }));
    fireEvent.click(screen.getAllByRole("button", { name: /redo/i })[0]);
    expect(h.onRerecord).toHaveBeenCalledWith(expect.objectContaining({ localId: 3 }));
    fireEvent.click(screen.getByRole("button", { name: /delete take 2/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^delete$/i }));
    expect(h.onRemove).toHaveBeenCalledWith(expect.objectContaining({ shotId: "4" }));
  });

  it("won't delete a take that is still uploading", () => {
    const rows = takeRows([localSeg(1, 0, 5, "uploading")], []);
    render(<TakeList rows={rows} {...handlers()} />);
    expect(screen.getByRole("button", { name: /delete take 1/i })).toBeDisabled();
  });
});

describe("Timeline", () => {
  it("jumps to the clicked moment and moves with the arrow keys", () => {
    const onSeek = vi.fn();
    render(<Timeline duration={100} time={20} takes={takeRows([], [serverShot(1, 10, 30)])} cues={[]} onSeek={onSeek} />);
    const track = screen.getByRole("slider");
    track.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 30, right: 200, bottom: 30 });
    fireEvent(track, new MouseEvent("pointerdown", { clientX: 50, bubbles: true })); // jsdom has no PointerEvent
    expect(onSeek).toHaveBeenLastCalledWith(25);
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(onSeek).toHaveBeenLastCalledWith(25);
    fireEvent.keyDown(track, { key: "Home" });
    expect(onSeek).toHaveBeenLastCalledWith(0);
    expect(screen.getByText("0:20 / 1:40")).toBeInTheDocument();
  });
});

describe("Timeline on a take", () => {
  it("jumps to the clicked moment inside a take, and highlights the take", () => {
    const onSeek = vi.fn();
    const onSelectTake = vi.fn();
    render(<Timeline duration={100} time={0} takes={takeRows([], [serverShot(1, 0, 40)])} cues={[]} onSeek={onSeek} onSelectTake={onSelectTake} />);
    const track = screen.getByRole("slider");
    track.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 30, right: 200, bottom: 30 });
    fireEvent(screen.getByRole("button", { name: /take 1/i }), new MouseEvent("pointerdown", { clientX: 40, bubbles: true }));
    expect(onSelectTake).toHaveBeenCalledWith(expect.objectContaining({ key: "server-1" }));
    expect(onSeek).toHaveBeenLastCalledWith(20);
  });
});

describe("RecordBar", () => {
  const base = { mode: "record", onModeChange: vi.fn(), engineState: "ready", time: 7, playing: false, onRecord: vi.fn(), onStop: vi.fn(), onPlayPause: vi.fn(), canRecord: true };

  it("offers to turn the camera on and record in one press", () => {
    const onRecord = vi.fn();
    render(<RecordBar {...base} onRecord={onRecord} camera={camera()} />);
    fireEvent.click(screen.getByRole("button", { name: /turn on camera and record/i }));
    expect(onRecord).toHaveBeenCalled();
  });

  it("records from the current moment, then offers Stop", () => {
    const { rerender } = render(<RecordBar {...base} camera={camera({ status: "on" })} />);
    expect(screen.getByRole("button", { name: /record from 0:07/i })).toBeInTheDocument();
    const onStop = vi.fn();
    rerender(<RecordBar {...base} engineState="recording" isArmed onStop={onStop} camera={camera({ status: "on" })} />);
    fireEvent.click(screen.getByRole("button", { name: /stop recording/i }));
    expect(onStop).toHaveBeenCalled();
    expect(screen.getByText(/sign along with the video/i)).toBeInTheDocument();
  });

  it("plays the video with the signing in Watch back", () => {
    const onPlayPause = vi.fn();
    render(<RecordBar {...base} mode="watch" onPlayPause={onPlayPause} camera={camera({ status: "on" })} />);
    fireEvent.click(screen.getByRole("button", { name: /play with my signing/i }));
    expect(onPlayPause).toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------- the page

describe("SubtitleDesigner", () => {
  const session = (overrides = {}) => ({
    playerContainerRef: vi.fn(),
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
    loadError: null,
    reload: vi.fn(),
    getPlayer: () => null,
    startRecording: vi.fn(async () => true),
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

  const editing = (overrides = {}) =>
    session({
      candidate: { videoId: "dQw4w9WgXcQ", status: "ready", meta: {} },
      recording: { id: "7", videoId: "dQw4w9WgXcQ" },
      player: { ready: true, error: null, time: 7, duration: 120, playing: false },
      engineState: "ready",
      ...overrides,
    });

  const details = (overrides = {}) => ({
    shots: [],
    playable: [],
    captions: [],
    captionsAvailable: true,
    recording: { id: "7", title: "Storytime in ASL", ownTitle: "Storytime in ASL", isPublic: false, videoId: "dQw4w9WgXcQ" },
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
    expect(screen.getByRole("button", { name: /^sign$/i })).toBeDisabled();
    expect(screen.queryByText(/your takes/i)).not.toBeInTheDocument();
  });

  it("offers the chosen video, then moves to signing after committing", async () => {
    mocks.session = session({ candidate: { videoId: "dQw4w9WgXcQ", status: "ready", meta: { title: "T" } } });
    mocks.camera = camera();
    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /use this video/i }));
    await act(async () => {});
    expect(mocks.session.commitVideo).toHaveBeenCalledWith({ title: "T", description: "" });
  });

  it("opens an existing recording on Sign with the video, the takes and one big Record button", () => {
    mocks.session = editing();
    mocks.camera = camera();
    mocks.details = details({ shots: [serverShot(4, 0, 52)] });
    renderAt("/video-subtitles/designer/7");
    expect(screen.getByRole("heading", { name: "Storytime in ASL" })).toBeInTheDocument();
    expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
    expect(screen.getByText(/your takes/i)).toBeInTheDocument();
    expect(screen.getByText("Take 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /turn on camera and record/i })).toBeEnabled();
    expect(screen.getByRole("slider", { name: /video timeline/i })).toBeInTheDocument();
  });

  it("turns the camera on, counts down 3-2-1, then records", async () => {
    vi.useFakeTimers();
    mocks.session = editing();
    mocks.camera = camera();
    mocks.details = details();
    const { rerender } = renderAt("/video-subtitles/designer/7");
    fireEvent.click(screen.getByRole("button", { name: /turn on camera and record/i }));
    expect(mocks.camera.start).toHaveBeenCalled();
    expect(mocks.session.startRecording).not.toHaveBeenCalled();

    // The camera comes on: the countdown starts by itself.
    mocks.camera = camera({ status: "on", stream: {} });
    mocks.session = editing({ canRecord: true });
    const store = configureStore({ reducer: { apiAuth: () => ({ status: "authenticated" }) } });
    rerender(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/video-subtitles/designer/7"]}>
          <Routes>
            <Route path="/video-subtitles/designer/:recordingId" element={<SubtitleDesigner />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/get ready to sign/i)).toBeInTheDocument();
    expect(screen.getByText("3", { selector: ".tm-countdown-n" })).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByText("2", { selector: ".tm-countdown-n" })).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(mocks.session.startRecording).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/get ready to sign/i)).not.toBeInTheDocument();
  });

  it("can cancel the countdown", async () => {
    vi.useFakeTimers();
    mocks.session = editing({ canRecord: true });
    mocks.camera = camera({ status: "on", stream: {} });
    mocks.details = details();
    renderAt("/video-subtitles/designer/7");
    fireEvent.click(screen.getByRole("button", { name: /record from 0:07/i }));
    expect(screen.getByText(/get ready to sign/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]);
    for (let i = 0; i < 4; i += 1) await act(async () => vi.advanceTimersByTime(1000));
    expect(mocks.session.startRecording).not.toHaveBeenCalled();
  });

  it("goes Sign -> Captions -> Publish; captions can be skipped", async () => {
    mocks.session = editing();
    mocks.camera = camera();
    mocks.details = details({ playable: [serverShot(4, 0, 52)], shots: [serverShot(4, 0, 52)] });
    renderAt("/video-subtitles/designer/7");
    fireEvent.click(screen.getByRole("button", { name: /next: captions/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/type what is said/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /skip captions and publish/i }));
    await waitFor(() => expect(screen.getByText(/who can watch/i)).toBeInTheDocument());
    expect(screen.getByTestId("preview")).toHaveTextContent("1 segment");
    expect(screen.getByText(/signing: 1 take/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /only me/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("explains a recording that couldn't be opened and offers a retry", () => {
    mocks.session = session({ loadError: { notFound: false, message: "The server didn't answer in time" } });
    mocks.camera = camera();
    renderAt("/video-subtitles/designer/7");
    expect(screen.getByText(/the server didn't answer in time/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mocks.session.reload).toHaveBeenCalled();
  });

  it("tells non-owners they can only watch", () => {
    mocks.session = session({ recording: { id: "7", readOnly: true } });
    mocks.camera = camera();
    renderAt("/video-subtitles/designer/7");
    expect(screen.getByText(/only the person who made this recording can edit it/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /watch it instead/i })).toHaveAttribute("href", "/video-subtitles/library/7");
  });

  it("shows error notices until dismissed", () => {
    mocks.session = session({ notice: { type: "error", message: "A segment couldn't be uploaded: boom" } });
    mocks.camera = camera();
    renderAt();
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});
