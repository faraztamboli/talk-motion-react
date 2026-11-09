import { describe, expect, it } from "vitest";
import { findShotIndexForTime, needsResync, nextShotAfter, shotOffset } from "./sync";
import {
  normalizeDetails,
  normalizeLegacyDetails,
  normalizeRecording,
  normalizeRecordingList,
  playableShots,
  thumbnailUrl,
} from "./normalizeRecording";

const VID = "dQw4w9WgXcQ";

describe("sync", () => {
  const shots = [
    { id: "1", startTime: 0, endTime: 10 },
    { id: "2", startTime: 20, endTime: 30 },
    { id: "5", startTime: 25, endTime: 28 }, // re-recorded passage, newer
  ];

  it("finds the segment covering a time; the newest wins on overlap", () => {
    expect(findShotIndexForTime(shots, 5)).toBe(0);
    expect(findShotIndexForTime(shots, 10)).toBe(-1);
    expect(findShotIndexForTime(shots, 15)).toBe(-1);
    expect(findShotIndexForTime(shots, 22)).toBe(1);
    expect(findShotIndexForTime(shots, 26)).toBe(2);
    expect(findShotIndexForTime([], 1)).toBe(-1);
    expect(findShotIndexForTime(shots, NaN)).toBe(-1);
  });

  it("computes offsets and drift", () => {
    expect(shotOffset(shots[1], 23.5)).toBe(3.5);
    expect(shotOffset(shots[1], 40)).toBe(10);
    expect(shotOffset(shots[1], 10)).toBe(0);
    expect(needsResync(3.0, 3.2)).toBe(false);
    expect(needsResync(3.0, 3.5)).toBe(true);
    expect(nextShotAfter(shots, 12).id).toBe("2");
    expect(nextShotAfter(shots, 29)).toBeNull();
  });
});

describe("normalizeRecording", () => {
  it("prefers the author's title, parses any YouTube URL form, and makes a thumbnail", () => {
    const r = normalizeRecording({
      id: 4,
      title: "",
      original_video_title: "YouTube title",
      original_video_url: `https://www.youtube.com/embed/${VID}`,
      is_public: 1,
      create_user: "ann",
      original_video_duration: "120.5",
    });
    expect(r).toMatchObject({
      id: "4",
      title: "YouTube title",
      videoId: VID,
      youtubeUrl: `https://www.youtube.com/watch?v=${VID}`,
      isPublic: true,
      owner: "ann",
      duration: 120.5,
      thumbnailUrl: `https://i.ytimg.com/vi/${VID}/hqdefault.jpg`,
    });
    expect(normalizeRecording({ id: 5, title: "Mine", original_video_url: "garbage" })).toMatchObject({
      title: "Mine",
      videoId: null,
      thumbnailUrl: null,
    });
    expect(normalizeRecording({ title: "no id" })).toBeNull();
    expect(thumbnailUrl(null)).toBeNull();
  });
});

describe("lists", () => {
  it("reads listVideoRecordings, legacy [rows, count] and bare arrays", () => {
    expect(normalizeRecordingList({ rows: [{ id: 1 }], total: 40 }).total).toBe(40);
    const legacy = normalizeRecordingList([[{ id: 1 }, { id: 2 }], { "count(*)": 9 }]);
    expect(legacy.rows.map((r) => r.id)).toEqual(["1", "2"]);
    expect(legacy.total).toBe(9);
    expect(normalizeRecordingList([{ id: 3 }, null, "junk"]).rows.map((r) => r.id)).toEqual(["3"]);
    expect(normalizeRecordingList({ error: "boom" })).toEqual({ rows: [], total: 0 });
    expect(normalizeRecordingList(null)).toEqual({ rows: [], total: 0 });
  });
});

describe("details", () => {
  it("normalizes getVideoRecordingDetails, keeping only playable segments for the viewer", () => {
    const d = normalizeDetails({
      ok: true,
      video_id: VID,
      recording: { id: 7, title: "T", create_user: "ann", is_public: true, original_video_url: "" },
      creator: { username: "ann", fullname: "Ann A", sm_img: "/a.png" },
      access: "public",
      can_edit: false,
      shots: [
        { id: 3, original_video_start: 5, original_video_end: 8, status: "complete", video_url: "https://v/3.mp4" },
        { id: 1, original_video_start: 0, original_video_end: 2, status: "complete", video_url: "https://v/1.mp4" },
        { id: 2, original_video_start: 2, original_video_end: 4, status: "failed", video_url: null, error_message: "x" },
        { id: 4, original_video_start: 9, original_video_end: 9, status: "complete", video_url: "https://v/4.mp4" },
      ],
      captions: [{ id: 1, language: "en", label: "English", cues: [{ start_ms: 0, end_ms: 900, text: "hi" }] }],
      captions_available: true,
    });
    expect(d.recording.videoId).toBe(VID);
    expect(d.recording.creator.fullname).toBe("Ann A");
    expect(d.shots).toHaveLength(4);
    expect(d.playable.map((s) => s.id)).toEqual(["1", "3"]);
    expect(d.captions[0].cues[0].text).toBe("hi");
    expect(d.canEdit).toBe(false);
  });

  it("normalizes the legacy getVideoRecording reply", () => {
    const d = normalizeLegacyDetails(
      {
        id: 7,
        create_user: "ann",
        original_video_url: `https://youtu.be/${VID}`,
        recording_shots: [{ id: 1, original_video_start: 0, original_video_end: 3, video_url: "https://v/1.mp4" }],
      },
      "ann"
    );
    expect(d.canEdit).toBe(true);
    expect(d.playable).toHaveLength(1);
    expect(d.captionsAvailable).toBe(false);
    expect(normalizeLegacyDetails("Some error string", "ann")).toBeNull();
    expect(normalizeLegacyDetails(null)).toBeNull();
  });

  it("playableShots needs a file, a length and a finished status", () => {
    expect(
      playableShots([
        { id: "1", startTime: 0, endTime: 1, videoUrl: "u", status: "uploading" },
        { id: "2", startTime: 0, endTime: 1, videoUrl: "u", status: "complete" },
      ]).map((s) => s.id)
    ).toEqual(["2"]);
  });
});
