import { describe, expect, it, vi } from "vitest";
import { decodeEntities, describeSearchError, parseSearchResponse, searchUrl, searchYouTube } from "./youtubeSearch";
import { detectJump, expectedVideoTime } from "../playbackWatch";
import { describeYouTubeError } from "../YouTubePlayerController";

describe("YouTube search", () => {
  it("asks only for embeddable videos", () => {
    const url = new URL(searchUrl({ apiKey: "k", query: " asl story " }));
    expect(url.searchParams.get("videoEmbeddable")).toBe("true");
    expect(url.searchParams.get("type")).toBe("video");
    expect(url.searchParams.get("q")).toBe("asl story");
  });

  it("decodes the API's HTML entities and skips items without a video id", () => {
    const { videos, nextPageToken } = parseSearchResponse({
      nextPageToken: "P2",
      items: [
        { id: { videoId: "abcdefghijk" }, snippet: { title: "Rock &amp; Roll &#39;24", channelTitle: "Ann&#x27;s", thumbnails: {} } },
        { id: { channelId: "x" }, snippet: { title: "a channel" } },
      ],
    });
    expect(videos).toHaveLength(1);
    expect(videos[0].title).toBe("Rock & Roll '24");
    expect(videos[0].channelTitle).toBe("Ann's");
    expect(videos[0].thumbnail).toContain("abcdefghijk");
    expect(nextPageToken).toBe("P2");
    expect(decodeEntities("&lt;b&gt; &unknown;")).toBe("<b> &unknown;");
  });

  it("explains quota and other failures", async () => {
    expect(describeSearchError(403, { error: { errors: [{ reason: "quotaExceeded" }] } })).toMatch(/today's limit/);
    expect(describeSearchError(500, null)).toMatch(/didn't work/);
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: { errors: [{ reason: "quotaExceeded" }] } }) }));
    await expect(searchYouTube({ apiKey: "k", query: "x", fetchImpl })).rejects.toThrow(/limit/);
  });
});

describe("jump detection while recording", () => {
  const last = { videoTime: 10, realTime: 0, rate: 1 };

  it("ignores normal playback and small jitter", () => {
    expect(expectedVideoTime(last, 500)).toBe(10.5);
    expect(detectJump(last, { videoTime: 10.6, realTime: 500 })).toBeNull();
  });

  it("splits on a forward seek at the expected time", () => {
    expect(detectJump(last, { videoTime: 60, realTime: 500 })).toEqual({ endTime: 10.5, newStartTime: 60 });
  });

  it("splits on a backward seek", () => {
    expect(detectJump({ videoTime: 50, realTime: 0, rate: 1 }, { videoTime: 20, realTime: 500 })).toEqual({ endTime: 50.5, newStartTime: 20 });
  });

  it("splits after a long stall where the video barely moved", () => {
    expect(detectJump(last, { videoTime: 10.2, realTime: 3000 })).toEqual({ endTime: 10.2, newStartTime: 10.2 });
  });
});

describe("YouTube player errors", () => {
  it.each([
    [2, "invalid"],
    [5, "html5"],
    [100, "unavailable"],
    [101, "not-embeddable"],
    [150, "not-embeddable"],
    [153, "referrer"],
    [999, "unknown"],
  ])("code %s -> %s", (data, code) => {
    const info = describeYouTubeError(data);
    expect(info.code).toBe(code);
    expect(info.message.length).toBeGreaterThan(10);
  });
});
