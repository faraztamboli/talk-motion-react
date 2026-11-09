import { describe, expect, it } from "vitest";
import {
  cleanCueText,
  cuesToSrt,
  cuesToVtt,
  detectCaptionFormat,
  formatClock,
  formatTimestamp,
  fromServerCues,
  parseCaptionFile,
  parseSrt,
  parseTimestamp,
  parseVtt,
  toServerCues,
} from "./cueFormats";
import {
  addCueAt,
  checkCues,
  cuesSignature,
  findCueIndexAt,
  mergeCues,
  nudgeCue,
  removeCue,
  setCueBoundary,
  shiftCue,
  updateCue,
} from "./cueOps";

const strip = (cues) => cues.map(({ startMs, endMs, text }) => ({ startMs, endMs, text }));

describe("timestamps", () => {
  it.each([
    ["01:02:03.004", 3723004],
    ["02:03.5", 123500],
    ["00:00:01,250", 1250],
    ["1:05", 65000],
    ["00:61:00.000", NaN],
    ["nonsense", NaN],
  ])("parseTimestamp(%s) = %s", (input, expected) => {
    expect(parseTimestamp(input)).toBe(expected);
  });

  it("formats WebVTT, SRT and compact clocks", () => {
    expect(formatTimestamp(3723004)).toBe("01:02:03.004");
    expect(formatTimestamp(1250, ",")).toBe("00:00:01,250");
    expect(formatClock(83250)).toBe("1:23.2");
    expect(formatClock(3723004)).toBe("1:02:03.0");
  });
});

describe("parseVtt", () => {
  it("reads cues, skips header, notes and styles, strips markup and settings", () => {
    const vtt = `\uFEFFWEBVTT - lesson

NOTE written by hand

STYLE
::cue { color: yellow }

intro
00:00:01.000 --> 00:00:03.500 align:start position:10%
<v Ann>Hello <i>there</i></v> &amp; welcome

00:04.000 --> 00:06.000
second
line`;
    const { cues, errors } = parseVtt(vtt);
    expect(errors).toEqual([]);
    expect(strip(cues)).toEqual([
      { startMs: 1000, endMs: 3500, text: "Hello there & welcome" },
      { startMs: 4000, endMs: 6000, text: "second line" },
    ]);
    expect(cues[0].id).toMatch(/^cue-/);
  });

  it("reports unreadable blocks and keeps the rest", () => {
    const { cues, errors } = parseVtt("WEBVTT\n\n00:00:01.000 --> nope\nbad\n\n00:00:02.000 --> 00:00:03.000\ngood");
    expect(strip(cues)).toEqual([{ startMs: 2000, endMs: 3000, text: "good" }]);
    expect(errors).toHaveLength(1);
  });
});

describe("parseSrt", () => {
  it("reads numbered blocks with comma milliseconds and Windows newlines", () => {
    const srt = "1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>Hi</i>\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\n{\\an8}Top\r\n";
    expect(strip(parseSrt(srt).cues)).toEqual([
      { startMs: 1000, endMs: 2500, text: "Hi" },
      { startMs: 3000, endMs: 4000, text: "Top" },
    ]);
  });
});

describe("parseCaptionFile", () => {
  it("detects the format", () => {
    expect(detectCaptionFormat("WEBVTT\n\n...")).toBe("vtt");
    expect(detectCaptionFormat("1\n00:00:01,000 --> 00:00:02,000\nx")).toBe("srt");
    expect(detectCaptionFormat("anything", "a.srt")).toBe("srt");
    expect(detectCaptionFormat("hello world")).toBeNull();
  });

  it("refuses files that are not captions", () => {
    const res = parseCaptionFile("just some text", "notes.txt");
    expect(res.cues).toEqual([]);
    expect(res.errors[0]).toMatch(/isn't a WebVTT/);
  });

  it("round-trips through VTT and SRT", () => {
    const cues = [
      { id: "a", startMs: 0, endMs: 1500, text: "Hi\nthere" },
      { id: "b", startMs: 61000, endMs: 62000, text: "Bye" },
    ];
    const vtt = cuesToVtt(cues);
    expect(vtt).toBe("WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nHi there\n\n00:01:01.000 --> 00:01:02.000\nBye\n");
    expect(strip(parseCaptionFile(vtt).cues)).toEqual([
      { startMs: 0, endMs: 1500, text: "Hi there" },
      { startMs: 61000, endMs: 62000, text: "Bye" },
    ]);
    const srt = cuesToSrt(cues);
    expect(srt.startsWith("1\n00:00:00,000 --> 00:00:01,500\nHi there\n\n2\n")).toBe(true);
    expect(strip(parseCaptionFile(srt).cues)).toHaveLength(2);
    expect(cuesToVtt([])).toBe("WEBVTT\n\n");
  });

  it("cleanCueText", () => {
    expect(cleanCueText("<00:00:01.000><c.yellow>a</c> &lt;b&gt;")).toBe("a <b>");
  });
});

describe("server cue mapping", () => {
  it("maps both ways and drops unusable cues", () => {
    const cues = fromServerCues([
      { start_ms: 2000, end_ms: 3000, text: "b" },
      { start_ms: 0, end_ms: 1000, text: "a" },
      { start_ms: "x", end_ms: 1, text: "bad" },
      { start_ms: 5, end_ms: 9, text: "  " },
    ]);
    expect(strip(cues)).toEqual([
      { startMs: 0, endMs: 1000, text: "a" },
      { startMs: 2000, endMs: 3000, text: "b" },
    ]);
    expect(toServerCues(cues)).toEqual([
      { start_ms: 0, end_ms: 1000, text: "a" },
      { start_ms: 2000, end_ms: 3000, text: "b" },
    ]);
    expect(fromServerCues(null)).toEqual([]);
  });
});

describe("cue operations", () => {
  const base = [
    { id: "a", startMs: 1000, endMs: 3000, text: "a" },
    { id: "b", startMs: 5000, endMs: 6000, text: "b" },
  ];

  it("finds the cue showing at a time", () => {
    expect(findCueIndexAt(base, 999)).toBe(-1);
    expect(findCueIndexAt(base, 1000)).toBe(0);
    expect(findCueIndexAt(base, 2999)).toBe(0);
    expect(findCueIndexAt(base, 3000)).toBe(-1);
    expect(findCueIndexAt(base, 5500)).toBe(1);
    expect(findCueIndexAt([], 10)).toBe(-1);
    const overlapping = [
      { id: "x", startMs: 0, endMs: 10000, text: "x" },
      { id: "y", startMs: 2000, endMs: 3000, text: "y" },
    ];
    expect(findCueIndexAt(overlapping, 2500)).toBe(1);
    expect(findCueIndexAt(overlapping, 5000)).toBe(0);
  });

  it("adds a cue at the playhead without running into the next one", () => {
    const { cues, cue } = addCueAt(base, 4000);
    expect(cue).toMatchObject({ startMs: 4000, endMs: 5000 });
    expect(cues.map((c) => c.id)).toEqual(["a", cue.id, "b"]);
    // inside a cue: starts where that cue ends
    expect(addCueAt(base, 2000).cue.startMs).toBe(3000);
    // after everything: default length
    expect(addCueAt(base, 7000).cue).toMatchObject({ startMs: 7000, endMs: 9000 });
  });

  it("marks in and out, keeping start before end", () => {
    expect(setCueBoundary(base, "a", "endMs", 3500)[0].endMs).toBe(3500);
    expect(setCueBoundary(base, "a", "endMs", 500)[0]).toMatchObject({ startMs: 1000, endMs: 3000 });
    const movedIn = setCueBoundary(base, "a", "startMs", 4000)[0];
    expect(movedIn.startMs).toBe(4000);
    expect(movedIn.endMs).toBeGreaterThan(4000);
  });

  it("nudges, shifts, updates, removes, merges", () => {
    expect(nudgeCue(base, "b", "startMs", -100)[1].startMs).toBe(4900);
    expect(shiftCue(base, "a", -5000)[0]).toMatchObject({ startMs: 0, endMs: 2000 });
    expect(updateCue(base, "a", { startMs: 7000, endMs: 8000 }).map((c) => c.id)).toEqual(["b", "a"]);
    expect(removeCue(base, "a").map((c) => c.id)).toEqual(["b"]);
    expect(mergeCues(base, [{ id: "z", startMs: 0, endMs: 1, text: "z" }], "append").map((c) => c.id)).toEqual(["z", "a", "b"]);
    expect(mergeCues(base, [{ id: "z", startMs: 0, endMs: 1, text: "z" }]).map((c) => c.id)).toEqual(["z"]);
  });

  it("checks cues before saving", () => {
    expect(checkCues(base)).toEqual({ errors: [], overlaps: 0, empty: 0 });
    const bad = checkCues([
      { id: "1", startMs: 0, endMs: 2000, text: "" },
      { id: "2", startMs: 1000, endMs: 500, text: "x".repeat(501) },
    ]);
    expect(bad.empty).toBe(1);
    expect(bad.overlaps).toBe(1);
    expect(bad.errors.join(" ")).toMatch(/longer than 500/);
    expect(bad.errors.join(" ")).toMatch(/ends before it starts/);
  });

  it("signatures ignore ids and order", () => {
    const shuffled = [{ ...base[1], id: "q" }, { ...base[0], id: "r" }];
    expect(cuesSignature(shuffled)).toBe(cuesSignature(base));
    expect(cuesSignature(updateCue(base, "a", { text: "changed" }))).not.toBe(cuesSignature(base));
  });
});
