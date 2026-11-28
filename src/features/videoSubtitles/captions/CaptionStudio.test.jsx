import "../testI18n";
import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
import CaptionStudio, { AUTOSAVE_MS, readingTimeMs } from "./CaptionStudio";

const store = configureStore({ reducer: { apiAuth: () => ({ status: "authenticated" }) } });

function renderStudio(props = {}) {
  const all = {
    recordingId: "7",
    tracks: [],
    captionsAvailable: true,
    getTimeMs: () => 5000,
    playerTimeMs: 5000,
    playing: false,
    onSeek: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onDirtyChange: vi.fn(),
    onSaveStateChange: vi.fn(),
    ...props,
  };
  const utils = render(
    <Provider store={store}>
      <CaptionStudio {...all} />
    </Provider>
  );
  return { ...utils, props: all };
}

const typeCaption = (text) => {
  const box = screen.getByPlaceholderText(/type what is said/i);
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter", code: "Enter", keyCode: 13, charCode: 13 });
};

beforeEach(() => {
  mocks.save = vi.fn(async ({ cues }) => ({ data: { track: { cues }, adjusted: 0 } }));
  mocks.del = vi.fn(async () => ({ data: { ok: true } }));
  mocks.auto = { status: "idle", progress: 0, error: null, subtitles: [], run: vi.fn(), cancel: vi.fn(), reset: vi.fn() };
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CaptionStudio", () => {
  it("explains when the server can't store captions", () => {
    renderStudio({ captionsAvailable: false });
    expect(screen.getByText(/aren't available on this server yet/i)).toBeInTheDocument();
  });

  it("adds what you type at the moment you started typing, then saves by itself", async () => {
    vi.useFakeTimers();
    let now = 5000;
    const { props } = renderStudio({ getTimeMs: () => now, playing: true });
    const box = screen.getByPlaceholderText(/type what is said/i);
    fireEvent.change(box, { target: { value: "H" } }); // starts at 0:05.0, pauses the video
    expect(props.onPause).toHaveBeenCalled();
    now = 9000; // typing takes a while
    fireEvent.change(box, { target: { value: "Hello everyone" } });
    fireEvent.keyDown(box, { key: "Enter", code: "Enter", keyCode: 13, charCode: 13 });
    expect(props.onPlay).toHaveBeenCalled(); // carries on where it paused
    expect(screen.getByLabelText(/caption 1 text/i)).toHaveValue("Hello everyone");
    expect(screen.getByRole("button", { name: /play from 0:05.0/i })).toBeInTheDocument();
    expect(box).toHaveValue("");
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);

    await act(async () => vi.advanceTimersByTime(AUTOSAVE_MS + 10));
    expect(mocks.save).toHaveBeenCalledTimes(1);
    const arg = mocks.save.mock.calls[0][0];
    expect(arg).toMatchObject({ recordingId: "7", language: "en", label: "English" });
    expect(arg.cues).toEqual([expect.objectContaining({ startMs: 5000, endMs: 5000 + readingTimeMs("Hello everyone"), text: "Hello everyone" })]);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("can leave the video playing while typing", () => {
    const { props } = renderStudio({ playing: true });
    fireEvent.click(screen.getByRole("checkbox", { name: /pause the video while i type/i }));
    fireEvent.change(screen.getByPlaceholderText(/type what is said/i), { target: { value: "Hi" } });
    expect(props.onPause).not.toHaveBeenCalled();
    expect(localStorage.getItem("tm_captions_pause_while_typing")).toBe("0");
  });

  it("edits text in place and fine-tunes timing on request", () => {
    let now = 5000;
    renderStudio({ getTimeMs: () => now });
    typeCaption("One");
    fireEvent.change(screen.getByLabelText(/caption 1 text/i), { target: { value: "One, two" } });
    expect(screen.getByLabelText(/caption 1 text/i)).toHaveValue("One, two");
    fireEvent.click(screen.getByRole("button", { name: /adjust timing of caption 1/i }));
    now = 8200;
    const end = screen.getByRole("button", { name: /ends .* set to now/i });
    fireEvent.click(end);
    expect(screen.getByRole("button", { name: /ends 0:08.2, set to now/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /starts later/i }));
    expect(screen.getByRole("button", { name: /starts 0:05.1, set to now/i })).toBeInTheDocument();
  });

  it("removes a caption", () => {
    renderStudio();
    typeCaption("Bye");
    fireEvent.click(screen.getByRole("button", { name: /remove caption 1/i }));
    expect(screen.queryByLabelText(/caption 1 text/i)).not.toBeInTheDocument();
  });

  it("imports a WebVTT file from More options", async () => {
    const { container } = renderStudio();
    const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOne\n\n00:00:03.000 --> 00:00:04.000\nTwo\n";
    const file = new File([vtt], "lesson.vtt", { type: "text/vtt" });
    file.text = async () => vtt;
    await act(async () => {
      fireEvent.change(container.querySelector('[data-testid="caption-file"]'), { target: { files: [file] } });
    });
    await waitFor(() => expect(screen.getByLabelText(/caption 2 text/i)).toHaveValue("Two"));
  });

  it("asks before replacing existing captions with an import", async () => {
    const { container } = renderStudio({
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

  it("brings automatic captions into the list", async () => {
    const { rerender, props } = renderStudio();
    mocks.auto = { ...mocks.auto, status: "done", subtitles: [{ id: "auto-1", startMs: 1000, endMs: 2500, text: "From speech" }] };
    rerender(
      <Provider store={store}>
        <CaptionStudio {...props} />
      </Provider>
    );
    await waitFor(() => expect(screen.getByLabelText(/caption 1 text/i)).toHaveValue("From speech"));
  });

  it("starts automatic captioning from a chosen audio file", () => {
    const { container } = renderStudio();
    const file = new File(["x"], "talk.mp3", { type: "audio/mpeg" });
    fireEvent.change(container.querySelector('[data-testid="caption-media"]'), { target: { files: [file] } });
    expect(mocks.auto.run).toHaveBeenCalledWith(file, { language: "en" });
  });

  it("says when saving failed and lets you try again", async () => {
    vi.useFakeTimers();
    mocks.save = vi.fn(async () => ({ error: { code: "server_error", message: "Only the recording's owner can edit its captions" } }));
    const { props } = renderStudio();
    typeCaption("ok");
    await act(async () => vi.advanceTimersByTime(AUTOSAVE_MS + 10));
    expect(screen.getByText(/owner can edit its captions/i)).toBeInTheDocument();
    expect(props.onSaveStateChange).toHaveBeenLastCalledWith("error");
    mocks.save.mockImplementation(async ({ cues }) => ({ data: { track: { cues }, adjusted: 0 } }));
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /try again/i })[0]);
    });
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(props.onSaveStateChange).toHaveBeenLastCalledWith("saved");
  });

  it("sizes a new caption to its reading time", () => {
    expect(readingTimeMs("Hi")).toBe(1500);
    expect(readingTimeMs("one two three four five six seven eight")).toBe(600 + 8 * 400);
    expect(readingTimeMs("word ".repeat(40))).toBe(7000);
  });
});
