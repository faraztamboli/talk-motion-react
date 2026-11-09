import "../testI18n";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

const mocks = vi.hoisted(() => ({
  save: null,
  del: null,
  auto: null,
}));
vi.mock("../recordingsApi", () => ({
  useSaveCaptionsMutation: () => [mocks.save, { isLoading: false }],
  useDeleteCaptionsMutation: () => [mocks.del, { isLoading: false }],
}));
vi.mock("../../autoCaptions/useAutoCaptions", () => ({ default: () => mocks.auto }));
import CaptionEditor from "./CaptionEditor";

const store = configureStore({ reducer: { apiAuth: () => ({ status: "authenticated" }) } });

function renderEditor(props = {}) {
  const all = {
    recordingId: "7",
    tracks: [],
    captionsAvailable: true,
    canEdit: true,
    getTimeMs: () => 5000,
    playerTimeMs: 0,
    onSeek: vi.fn(),
    onPlay: vi.fn(),
    onDirtyChange: vi.fn(),
    ...props,
  };
  const utils = render(
    <Provider store={store}>
      <CaptionEditor {...all} />
    </Provider>
  );
  return { ...utils, props: all };
}

beforeEach(() => {
  mocks.save = vi.fn(async ({ cues }) => ({ data: { track: { cues }, adjusted: 0 } }));
  mocks.del = vi.fn(async () => ({ data: { ok: true } }));
  mocks.auto = { status: "idle", progress: 0, error: null, subtitles: [], run: vi.fn(), cancel: vi.fn(), reset: vi.fn() };
});

describe("CaptionEditor", () => {
  it("explains when the server can't store captions", () => {
    renderEditor({ captionsAvailable: false });
    expect(screen.getByText(/aren't available on this server yet/i)).toBeInTheDocument();
  });

  it("adds a caption at the playhead, marks it dirty, and saves it", async () => {
    const { props } = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /add caption at playhead/i }));
    const text = screen.getByLabelText(/caption 1 text/i);
    expect(screen.getAllByText("0:05.0").length).toBeGreaterThan(0);
    fireEvent.change(text, { target: { value: "Hello everyone" } });
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: /save captions/i }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    const arg = mocks.save.mock.calls[0][0];
    expect(arg).toMatchObject({ recordingId: "7", language: "en", label: "English" });
    expect(arg.cues).toEqual([expect.objectContaining({ startMs: 5000, endMs: 7000, text: "Hello everyone" })]);
    await waitFor(() => expect(props.onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it("sets start and end to the video's time and nudges by a tenth of a second", () => {
    let now = 5000;
    renderEditor({ getTimeMs: () => now });
    fireEvent.click(screen.getByRole("button", { name: /add caption at playhead/i }));
    now = 8200;
    fireEvent.click(screen.getByRole("button", { name: /end 0:07.0, set to now/i }));
    expect(screen.getByRole("button", { name: /end 0:08.2, set to now/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start later/i }));
    expect(screen.getByRole("button", { name: /start 0:05.1, set to now/i })).toBeInTheDocument();
  });

  it("imports a WebVTT file", async () => {
    const { container } = renderEditor();
    const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOne\n\n00:00:03.000 --> 00:00:04.000\nTwo\n";
    const file = new File([vtt], "lesson.vtt", { type: "text/vtt" });
    file.text = async () => vtt;
    await act(async () => {
      fireEvent.change(container.querySelector('[data-testid="caption-file"]'), { target: { files: [file] } });
    });
    await waitFor(() => expect(screen.getByLabelText(/caption 2 text/i)).toHaveValue("Two"));
  });

  it("asks before replacing existing captions with an import", async () => {
    const { container } = renderEditor({
      tracks: [{ id: "1", language: "en", label: "English", cues: [{ id: "a", startMs: 0, endMs: 1000, text: "Old" }] }],
    });
    const srt = "1\n00:00:05,000 --> 00:00:06,000\nNew\n";
    const file = new File([srt], "new.srt");
    file.text = async () => srt;
    await act(async () => {
      fireEvent.change(container.querySelector('[data-testid="caption-file"]'), { target: { files: [file] } });
    });
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /add to them/i }));
    await waitFor(() => expect(screen.getByLabelText(/caption 2 text/i)).toHaveValue("New"));
    expect(screen.getByLabelText(/caption 1 text/i)).toHaveValue("Old");
  });

  it("brings automatic captions into the editor", async () => {
    const { rerender } = renderEditor();
    mocks.auto = { ...mocks.auto, status: "done", subtitles: [{ id: "auto-1", startMs: 1000, endMs: 2500, text: "From speech" }] };
    rerender(
      <Provider store={store}>
        <CaptionEditor recordingId="7" tracks={[]} captionsAvailable canEdit getTimeMs={() => 0} playerTimeMs={0} onSeek={vi.fn()} />
      </Provider>
    );
    await waitFor(() => expect(screen.getByLabelText(/caption 1 text/i)).toHaveValue("From speech"));
  });

  it("starts automatic captioning from a chosen audio file", async () => {
    const { container } = renderEditor();
    const file = new File(["x"], "talk.mp3", { type: "audio/mpeg" });
    fireEvent.change(container.querySelector('[data-testid="caption-media"]'), { target: { files: [file] } });
    expect(mocks.auto.run).toHaveBeenCalledWith(file, { language: "en" });
  });

  it("blocks saving captions that are too long and reports server errors", async () => {
    mocks.save = vi.fn(async () => ({ error: { code: "server_error", message: "Only the recording's owner can edit its captions" } }));
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /add caption at playhead/i }));
    fireEvent.change(screen.getByLabelText(/caption 1 text/i), { target: { value: "ok" } });
    fireEvent.click(screen.getByRole("button", { name: /save captions/i }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(await screen.findByText(/owner can edit its captions/i)).toBeInTheDocument();
  });

  it("is read-only for viewers", () => {
    renderEditor({ canEdit: false, tracks: [{ id: "1", language: "en", cues: [{ id: "a", startMs: 0, endMs: 1000, text: "Hi" }] }] });
    expect(screen.queryByRole("button", { name: /add caption/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/caption 1 text/i)).toHaveAttribute("readonly");
  });
});
