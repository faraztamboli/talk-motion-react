import "../testI18n";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { normalizeRecording } from "../normalizeRecording";

const api = vi.hoisted(() => ({ result: null, lastArgs: null, setPrivacy: null, del: null }));
vi.mock("../recordingsApi", () => ({
  useListRecordingsQuery: (args) => {
    api.lastArgs = args;
    return api.result;
  },
  useSetRecordingPrivacyMutation: () => [api.setPrivacy],
  useDeleteRecordingMutation: () => [api.del],
}));
import RecordingLibrary from "./RecordingLibrary";

const rec = (id, extra = {}) =>
  normalizeRecording({
    id,
    title: `Recording ${id}`,
    original_video_url: "https://youtu.be/dQw4w9WgXcQ",
    create_user: "ann",
    creator_fullname: "Ann A",
    is_public: 0,
    shot_count: 3,
    caption_count: 1,
    ...extra,
  });

const renderLib = (mode) =>
  render(
    <MemoryRouter>
      <RecordingLibrary mode={mode} />
    </MemoryRouter>
  );

beforeEach(() => {
  api.setPrivacy = vi.fn(async () => ({ data: {} }));
  api.del = vi.fn(async () => ({ data: {} }));
});

describe("RecordingLibrary", () => {
  it("invites a first recording when My Videos is empty", () => {
    api.result = { data: { rows: [], total: 0 }, isLoading: false, isFetching: false };
    renderLib("personal");
    expect(screen.getByText(/haven't made a recording yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /make your first recording/i })).toHaveAttribute("href", "/video-subtitles/designer");
    expect(api.lastArgs).toMatchObject({ scope: "mine", page: 1, pageSize: 24 });
  });

  it("gives owners privacy, edit and delete on their own recordings", async () => {
    api.result = { data: { rows: [rec(1, { is_public: 1 }), rec(2)], total: 2 }, isLoading: false, isFetching: false };
    renderLib("personal");
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();
    expect(screen.getAllByRole("link", { name: /edit/i })[0]).toHaveAttribute("href", "/video-subtitles/designer/1");
    fireEvent.click(switches[1]);
    fireEvent.click(await screen.findByRole("button", { name: /yes/i }));
    await waitFor(() => expect(api.setPrivacy).toHaveBeenCalledWith({ id: "2", isPublic: true }));
    fireEvent.click(screen.getAllByRole("button", { name: /delete recording/i })[0]);
    const confirm = await screen.findByRole("tooltip");
    fireEvent.click(within(confirm).getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(api.del).toHaveBeenCalledWith("1"));
  });

  it("switches to recordings shared with me, without owner actions", () => {
    api.result = { data: { rows: [rec(5)], total: 1 }, isLoading: false, isFetching: false };
    renderLib("personal");
    fireEvent.click(screen.getByText(/shared with me/i));
    expect(api.lastArgs.scope).toBe("shared");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByText("Ann A")).toBeInTheDocument();
  });

  it("shows the public library with creators, search and pages", () => {
    api.result = { data: { rows: Array.from({ length: 24 }, (_, i) => rec(i + 1)), total: 60 }, isLoading: false, isFetching: false };
    renderLib("public");
    expect(api.lastArgs.scope).toBe("public");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ann A")).toHaveLength(24);
    expect(screen.getByRole("listitem", { name: "3" })).toBeInTheDocument(); // pagination: 60 / 24 = 3 pages
    fireEvent.click(screen.getByRole("listitem", { name: "2" }));
    expect(api.lastArgs.page).toBe(2);
    fireEvent.change(screen.getByLabelText(/search by title/i), { target: { value: "story" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(api.lastArgs).toMatchObject({ search: "story", page: 1 });
  });

  it("falls back to a placeholder when a thumbnail fails, and never crashes on odd rows", () => {
    api.result = { data: { rows: [rec(9, { original_video_url: "not a youtube url" })], total: 1 }, isLoading: false, isFetching: false };
    const { container } = renderLib("public");
    expect(container.querySelector(".tm-lib-thumb-fallback")).toBeInTheDocument();
  });

  it("shows load errors with a retry", () => {
    const refetch = vi.fn();
    api.result = { error: { code: "disconnected", message: "x" }, isLoading: false, isFetching: false, refetch };
    renderLib("public");
    expect(screen.getByText(/couldn't be loaded/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
