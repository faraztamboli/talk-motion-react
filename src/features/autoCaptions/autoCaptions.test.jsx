import React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ApiError } from "../../api/http";
import { cuesToSubtitles, formatTimestamp, subtitlesToVtt } from "./cues";
import useAutoCaptions, { describeCaptionError } from "./useAutoCaptions";
import AutoCaptionsPanel from "./AutoCaptionsPanel";

const file = new File(["x"], "talk.mp3", { type: "audio/mpeg" });

describe("cue mapping", () => {
  it("maps API cues to sorted, editable rows and drops bad ones", () => {
    const rows = cuesToSubtitles([
      { start_ms: 4000, end_ms: 6000, text: " second " },
      { start_ms: 1000, end_ms: 3000, text: "first" },
      { start_ms: 7000, end_ms: 7000, text: "zero length" },
      { start_ms: 8000, end_ms: 9000, text: "   " },
      { start_ms: "x", end_ms: 9000, text: "bad" },
    ]);
    expect(rows).toEqual([
      { id: "auto-1", startMs: 1000, endMs: 3000, text: "first" },
      { id: "auto-2", startMs: 4000, endMs: 6000, text: "second" },
      { id: "auto-3", startMs: 7000, endMs: 8000, text: "zero length" },
    ]);
    expect(cuesToSubtitles(null)).toEqual([]);
  });

  it("formats WebVTT", () => {
    expect(formatTimestamp(3723004)).toBe("01:02:03.004");
    expect(subtitlesToVtt([{ id: "a", startMs: 0, endMs: 1500, text: "Hi\nthere" }])).toBe(
      "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nHi there\n"
    );
  });
});

describe("useAutoCaptions", () => {
  it("reports upload progress, then loads cues as editable subtitles", async () => {
    let finish;
    const upload = vi.fn((f, { onUploadProgress }) => {
      onUploadProgress(0.5);
      return new Promise((resolve) => {
        finish = () => {
          onUploadProgress(1);
          resolve({ cues: [{ start_ms: 0, end_ms: 2000, text: "Hello" }], vtt: "", duration_ms: 2000 });
        };
      });
    });
    const { result } = renderHook(() => useAutoCaptions({ upload }));
    let promise;
    act(() => {
      promise = result.current.run(file);
    });
    expect(result.current.status).toBe("uploading");
    expect(result.current.progress).toBe(0.5);
    await act(async () => {
      finish();
      await promise;
    });
    expect(result.current.status).toBe("done");
    expect(result.current.subtitles).toHaveLength(1);

    act(() => result.current.updateSubtitle("auto-1", { text: "Hello there" }));
    expect(result.current.subtitles[0].text).toBe("Hello there");
    act(() => result.current.removeSubtitle("auto-1"));
    expect(result.current.subtitles).toEqual([]);
  });

  it("turns API failures into friendly messages", async () => {
    const upload = vi.fn().mockRejectedValue(new ApiError(429, { detail: "Too many" }));
    const { result } = renderHook(() => useAutoCaptions({ upload }));
    await act(async () => {
      await result.current.run(file);
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error.fallback).toMatch(/try again in an hour/i);
    expect(describeCaptionError(new ApiError(413)).key).toBe("captions.error.tooBig");
    expect(describeCaptionError(new ApiError(415)).key).toBe("captions.error.format");
    expect(describeCaptionError(new ApiError(503)).key).toBe("captions.error.unavailable");
    expect(describeCaptionError(new ApiError(0)).key).toBe("captions.error.network");
    expect(describeCaptionError(new Error("boom")).key).toBe("captions.error.generic");
  });

  it("returns to idle when cancelled", async () => {
    const upload = vi.fn(
      (f, { signal }) =>
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("x", "AbortError"))))
    );
    const { result } = renderHook(() => useAutoCaptions({ upload }));
    let promise;
    act(() => {
      promise = result.current.run(file);
    });
    await act(async () => {
      result.current.cancel();
      await promise;
    });
    expect(result.current.status).toBe("idle");
  });
});

describe("AutoCaptionsPanel", () => {
  const renderPanel = (status, props = {}) =>
    render(
      <Provider store={configureStore({ reducer: { apiAuth: () => ({ status }) } })}>
        <AutoCaptionsPanel {...props} />
      </Provider>
    );

  it("is hidden without an API session", () => {
    const { container } = renderPanel("unavailable");
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the action when signed in and offers the current media", async () => {
    renderPanel("authenticated", { media: file });
    expect(screen.getByText("Auto-caption")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /caption this video/i })).toBeEnabled());
  });
});
