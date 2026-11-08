import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CaptionStream from "./components/CaptionStream";
import { clearSignCache, normaliseWord } from "./dictionaryApi";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("../../api/http", () => ({ apiFetch, getAccessToken: () => "tok" }));

const utterances = [{ id: 1, participant_id: "me", text: "Hello, world!", source: "typed" }];
const draw = (tapWords) =>
  render(
    <CaptionStream utterances={utterances} partials={{ p2: "still talking" }} participants={{}} meId="me" tapWords={tapWords} />
  );

beforeEach(() => {
  clearSignCache();
  apiFetch.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("tap a word", () => {
  it("normalises words", () => {
    expect(normaliseWord('"Hello,"')).toBe("hello");
    expect(normaliseWord("...")).toBe("");
  });

  it("plays the sign video muted and looping, and caches the lookup", async () => {
    apiFetch.mockResolvedValue({ hello: { videos: [{ url: "https://v/h.mp4", concept: "hello" }], fingerspell: false } });
    const { container } = draw(true);
    const btn = screen.getByRole("button", { name: "Hello," });
    fireEvent.click(btn);
    await waitFor(() => expect(document.querySelector("video")).not.toBeNull());
    const video = document.querySelector("video");
    expect(video.getAttribute("src")).toBe("https://v/h.mp4");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(apiFetch).toHaveBeenCalledWith("/dictionary/lookup?words=hello");
    fireEvent.click(btn); // close
    fireEvent.click(btn); // reopen: no second request
    await waitFor(() => expect(document.querySelector("video")).not.toBeNull());
    expect(apiFetch).toHaveBeenCalledTimes(1);
    // partial text is not tappable
    expect(container.textContent).toContain("still talking");
    expect(screen.queryByRole("button", { name: /still/ })).toBeNull();
  });

  it("explains when there is no video and hints at fingerspelling", async () => {
    apiFetch.mockResolvedValue({ world: { videos: [], fingerspell: true } });
    draw(true);
    fireEvent.click(screen.getByRole("button", { name: "world!" }));
    expect(await screen.findByText("No sign video for this word yet")).toBeTruthy();
    expect(screen.getByText(/fingerspell/)).toBeTruthy();
  });

  it("shows plain text, no buttons, for guests", () => {
    draw(false);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Hello, world!")).toBeTruthy();
  });
});
