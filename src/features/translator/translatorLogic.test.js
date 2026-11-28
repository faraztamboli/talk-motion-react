import { describe, expect, it } from "vitest";
import { createSegmenter } from "../signInput/segmenter";
import { glossOf, initialSentence, sentenceReducer } from "../signInput/sentence";
import { buildPlaylist, currentItem, initialQueue, queueReducer, resolveKey } from "./playlist";
import {
  bodyScale,
  fillHandGaps,
  framesForItem,
  lerpFrame,
  prepareFrames,
  present,
  RECORDED_ASPECT,
  smoothFrames,
  TRANSITION_FRAMES,
  toViewer,
  trimRest,
} from "./avatarFrames";
import { describeWebSpeechError, describeWhisperError, micErrorCode } from "./speechErrors";
import { pickVoice } from "./useSpeechOutput";
import { legacyInputOf, topPredictions } from "../signInput/useBrowserModel";

const hand = (x, y = 0.5) => ({ rightHandLandmarks: [{ x, y, z: 0 }] });
const noHands = { poseLandmarks: [] };

/** Feed frames 33 ms apart; returns all events. */
function feed(seg, frames, t0 = 0) {
  const events = [];
  frames.forEach((f, i) => events.push(...seg.push(f, t0 + i * 33)));
  return events;
}
const moving = (n, start = 0.2, step = 0.02, y = 0.5) => Array.from({ length: n }, (_, i) => hand(start + i * step, y));
const still = (n, x = 0.5, y = 0.5) => Array.from({ length: n }, () => hand(x, y));

describe("segmenter", () => {
  it("cuts one segment per sign when the hands stop", () => {
    const seg = createSegmenter();
    const events = feed(seg, [...still(3), ...moving(15), ...still(8)]);
    const segments = events.filter((e) => e.type === "segment");
    expect(segments).toHaveLength(1);
    expect(segments[0].frames.length).toBeGreaterThanOrEqual(15);
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["signing", "resting"]));
  });

  it("never predicts on hands resting in view", () => {
    const seg = createSegmenter();
    const events = feed(seg, still(200));
    expect(events.filter((e) => e.type === "segment")).toHaveLength(0);
  });

  it("ignores movement in the rest zone near the bottom edge", () => {
    const seg = createSegmenter();
    const events = feed(seg, moving(40, 0.1, 0.02, 0.95));
    expect(events.filter((e) => e.type === "segment")).toHaveLength(0);
  });

  it("drops tiny twitches below the minimum path", () => {
    const seg = createSegmenter();
    const events = feed(seg, [...moving(10, 0.5, 0.013), ...still(10)]);
    // 9 steps x 0.013 = 0.117 travel, enough; a 3-frame twitch is not
    expect(events.filter((e) => e.type === "segment")).toHaveLength(1);
    const seg2 = createSegmenter();
    const events2 = feed(seg2, [...moving(3, 0.5, 0.013), ...still(10)]);
    expect(events2.filter((e) => e.type === "segment")).toHaveLength(0);
  });

  it("keeps two separate signs as two segments (real repeats survive)", () => {
    const seg = createSegmenter();
    const events = feed(seg, [...moving(12), ...still(8), ...moving(12, 0.6, -0.02), ...still(8)]);
    expect(events.filter((e) => e.type === "segment")).toHaveLength(2);
  });

  it("cuts long signs at the cap", () => {
    const seg = createSegmenter({ maxSegmentFrames: 20 });
    const zigzag = Array.from({ length: 45 }, (_, i) => hand(i % 2 ? 0.3 : 0.35));
    const events = feed(seg, zigzag);
    expect(events.filter((e) => e.type === "segment")).toHaveLength(2);
  });

  it("reports hands gone, then idle once after idleMs", () => {
    const seg = createSegmenter({ idleMs: 500 });
    const events = feed(seg, [...moving(12), ...Array.from({ length: 40 }, () => noHands)]);
    const types = events.map((e) => e.type);
    expect(types.filter((t) => t === "handsGone")).toHaveLength(1);
    expect(types.filter((t) => t === "idle")).toHaveLength(1);
    expect(types.indexOf("segment")).toBeLessThan(types.indexOf("idle"));
  });

  it("flush cuts a sign in progress (Send while signing)", () => {
    const seg = createSegmenter();
    feed(seg, moving(12));
    expect(seg.flush().filter((e) => e.type === "segment")).toHaveLength(1);
    expect(seg.flush()).toEqual([]);
  });
});

describe("sentence reducer", () => {
  const predict = (state, predictions, requestId = 1, generation = state.generation) =>
    sentenceReducer(sentenceReducer(state, { type: "requested", generation, requestId }), {
      type: "predicted",
      generation,
      requestId,
      predictions,
    });

  it("firm and tentative words, with alternatives; misses are reported", () => {
    let s = predict(initialSentence, [{ word: "hello", confidence: 0.9 }, { word: "help", confidence: 0.05 }]);
    s = predict(s, [{ word: "you", confidence: 0.5 }, { word: "your", confidence: 0.3 }], 2);
    s = predict(s, [{ word: "x", confidence: 0.1 }], 3);
    expect(s.words.map((w) => [w.word, w.status])).toEqual([
      ["hello", "firm"],
      ["you", "tentative"],
    ]);
    expect(s.words[1].alternatives).toEqual([{ word: "your", confidence: 0.3 }]);
    expect(s.lastMiss.best.word).toBe("x");
    expect(s.pending).toEqual([]);
    expect(glossOf(s)).toEqual(["hello", "you"]);
  });

  it("keeps real repeats", () => {
    let s = predict(initialSentence, [{ word: "very", confidence: 0.9 }]);
    s = predict(s, [{ word: "very", confidence: 0.9 }], 2);
    expect(glossOf(s)).toEqual(["very", "very"]);
  });

  it("ignores answers from before a clear, so pending never goes negative or sticks", () => {
    let s = sentenceReducer(initialSentence, { type: "requested", generation: 0, requestId: 1 });
    expect(s.pending).toEqual([1]);
    s = sentenceReducer(s, { type: "clear" });
    expect(s.pending).toEqual([]);
    s = sentenceReducer(s, { type: "predicted", generation: 0, requestId: 1, predictions: [{ word: "late", confidence: 0.99 }] });
    expect(s.words).toEqual([]);
    expect(s.pending).toEqual([]);
  });

  it("a failure frees the request and shows an error until the next success", () => {
    let s = sentenceReducer(initialSentence, { type: "requested", generation: 0, requestId: 1 });
    s = sentenceReducer(s, { type: "failed", generation: 0, requestId: 1, message: "timeout" });
    expect(s.pending).toEqual([]);
    expect(s.error).toBe("timeout");
    s = predict(s, [{ word: "ok", confidence: 0.9 }], 2);
    expect(s.error).toBeNull();
  });

  it("undo, remove, choose an alternative, confirm", () => {
    let s = predict(initialSentence, [{ word: "a", confidence: 0.9 }]);
    s = predict(s, [{ word: "you", confidence: 0.5 }, { word: "your", confidence: 0.4 }], 2);
    const youId = s.words[1].id;
    s = sentenceReducer(s, { type: "choose", id: youId, word: "your" });
    expect(s.words[1]).toMatchObject({ word: "your", status: "firm" });
    expect(s.words[1].alternatives[0].word).toBe("you");
    s = sentenceReducer(s, { type: "undo" });
    expect(glossOf(s)).toEqual(["a"]);
    s = predict(s, [{ word: "b", confidence: 0.4 }], 3);
    s = sentenceReducer(s, { type: "confirm", id: s.words[1].id });
    expect(s.words[1].status).toBe("firm");
    s = sentenceReducer(s, { type: "remove", id: s.words[0].id });
    expect(glossOf(s)).toEqual(["b"]);
  });

  it("sent starts a new sentence and a new generation", () => {
    let s = predict(initialSentence, [{ word: "a", confidence: 0.9 }]);
    s = sentenceReducer(s, { type: "sent" });
    expect(s.words).toEqual([]);
    expect(s.generation).toBe(1);
  });
});

describe("playlist", () => {
  const dict = {
    hello: { remote_url: "https://v/hello.mp4" },
    h: { remote_url: "https://v/h.mp4" },
    _i_: { remote_url: "https://v/i.mp4" },
    "good morning": { remote_url: "https://v/gm.mp4" },
  };

  it("resolves keys with or without underscores", () => {
    expect(resolveKey(dict, "_h")).toBe("h");
    expect(resolveKey(dict, "_i_")).toBe("_i_");
    expect(resolveKey(dict, "zz")).toBeNull();
  });

  it("skips separators, plays fingerspelling, reports words with no video", () => {
    const { items, missing } = buildPlaylist(dict, ["hello", "good morning", "_h", "x", " ", "nope"], 7);
    expect(items.map((i) => i.label)).toEqual(["hello", "good morning", "H"]);
    expect(items[2]).toMatchObject({ fingerspelled: true, url: "https://v/h.mp4" });
    expect(missing).toEqual(["hx", "nope"]);
  });

  it("queue: enqueue while idle starts; ended advances; stop clears; replay replays the last batch", () => {
    let q = queueReducer(initialQueue, { type: "enqueue", items: [{ id: "a" }, { id: "b" }] });
    expect(currentItem(q).id).toBe("a");
    q = queueReducer(q, { type: "enqueue", items: [{ id: "c" }] });
    expect(currentItem(q).id).toBe("a");
    q = queueReducer(q, { type: "ended" });
    q = queueReducer(q, { type: "ended" });
    expect(currentItem(q).id).toBe("c");
    q = queueReducer(q, { type: "ended" });
    expect(currentItem(q)).toBeNull();
    q = queueReducer(q, { type: "replay" });
    expect(currentItem(q).id).toMatch(/^c~r/);
    q = queueReducer(q, { type: "stop" });
    expect(currentItem(q)).toBeNull();
    expect(q.items).toEqual([]);
  });
});

describe("avatar frames", () => {
  const frame = (x) => ({ lh: [[x, 0.5, 0]], rh: [[0, 0, 0]], pose: [[x, 0.2, 0]] });

  it("unmirrors recorded samples but not dictionary poses, leaving untracked points at zero", () => {
    // flipped back about the middle and widened to the camera's shape; the hands change sides
    const x = 0.5 + 0.2 * RECORDED_ASPECT;
    const seen = toViewer(frame(0.3), true);
    expect(seen.lh).toEqual([[0, 0, 0]]);
    expect(seen.rh[0][0]).toBeCloseTo(x);
    expect(seen.pose[0][0]).toBeCloseTo(x);
    expect(toViewer(frame(0.3), false)).toEqual(frame(0.3));
  });

  it("gives recorded samples their own left and right back", () => {
    const pose = Array.from({ length: 33 }, (_, i) => [0.4, 0.5, i]);
    pose[11] = [0.7, 0.5, 11]; // stored as "left shoulder", but mirrored: it is the right one
    pose[12] = [0.3, 0.5, 12];
    const seen = toViewer({ lh: [], rh: [], pose }, true).pose;
    expect(seen[12][0]).toBeLessThan(0.5); // right shoulder on the viewer's left, as on camera
    expect(seen[11][0]).toBeGreaterThan(0.5);
    expect(seen[0][2]).toBe(0); // the nose has no pair
    expect(seen[7][2]).toBeCloseTo(8 * RECORDED_ASPECT); // ears swapped
  });

  it("blends from the previous frame into the next sign", () => {
    const frames = framesForItem({ frames: [frame(0.6)], mirrored: false }, frame(0.2));
    expect(frames).toHaveLength(TRANSITION_FRAMES + 1);
    expect(frames[0].lh[0][0]).toBeGreaterThan(0.2);
    expect(frames[0].lh[0][0]).toBeLessThan(0.6);
    expect(lerpFrame(frame(0.2), frame(0.6), 0.5).lh[0][0]).toBeCloseTo(0.4);
  });
});

describe("avatar frame clean-up", () => {
  const Z = [0, 0, 0];
  const handAt = (x, y = 0.5) => Array.from({ length: 21 }, (_, i) => [x + i * 0.001, y, 0]);
  const poseAt = (wristX, wristY = 0.5) => {
    const pose = Array.from({ length: 33 }, () => [0.5, 0.5, 0]);
    pose[11] = [0.7, 0.4, 0];
    pose[12] = [0.3, 0.4, 0];
    pose[2] = [0.52, 0.2, 0];
    pose[5] = [0.48, 0.2, 0];
    pose[15] = [wristX, wristY, 0];
    pose[16] = [0.3, 0.8, 0];
    return pose;
  };
  const f = (x, { hand = true, wristY = 0.5 } = {}) => ({ lh: hand ? handAt(x) : handAt(0).map(() => Z), rh: handAt(0).map(() => Z), pose: poseAt(x, wristY) });

  it("fills a hand the tracker lost for a few frames, following the body's wrist", () => {
    const frames = [f(0.2), f(0.3, { hand: false }), f(0.5, { hand: false }), f(0.5)];
    const out = fillHandGaps(frames, 5);
    expect(present(out[1].lh)).toBe(true);
    expect(present(out[2].lh)).toBe(true);
    // the shape is blended, the position follows the pose wrist (0.3 then 0.5)
    expect(out[1].lh[0][0]).toBeCloseTo(0.3);
    expect(out[2].lh[0][0]).toBeCloseTo(0.5);
    expect(out[0]).toBe(frames[0]);
  });

  it("leaves a hand out that really left: trailing, too long, or wrist outside the picture", () => {
    expect(present(fillHandGaps([f(0.2), f(0.3, { hand: false })], 5)[1].lh)).toBe(false);
    const long = [f(0.2), ...Array.from({ length: 6 }, () => f(0.3, { hand: false })), f(0.4)];
    expect(present(fillHandGaps(long, 5)[3].lh)).toBe(false);
    const dropped = [f(0.2), f(0.3, { hand: false, wristY: 1.2 }), f(0.4)];
    expect(present(fillHandGaps(dropped, 5)[1].lh)).toBe(false);
    // a hand that has not come in yet stays out too
    expect(present(fillHandGaps([f(0.2, { hand: false }), f(0.3)], 5)[0].lh)).toBe(false);
  });

  it("removes a one-frame tracking spike and keeps untracked points at zero", () => {
    const frames = [f(0.3), f(0.3), f(0.9), f(0.3), f(0.3)];
    frames[1].rh = handAt(0.6);
    const out = smoothFrames(frames);
    expect(out[2].lh[0][0]).toBeCloseTo(0.3);
    expect(out[2].rh[0]).toEqual(Z);
    expect(out[1].rh[0][0]).toBeCloseTo(0.6); // tracked once: nothing to mix with
  });

  it("trims the arms-at-rest frames at a clip's edges, the start only after another sign", () => {
    const rest = f(0.3, { hand: false, wristY: 1.2 });
    const frames = [rest, f(0.3), f(0.4), rest, rest];
    expect(trimRest(frames)).toHaveLength(3); // rises from rest, but doesn't drop again
    expect(trimRest(frames, { trimStart: true })).toHaveLength(2);
    expect(trimRest([rest, rest])).toHaveLength(2); // nothing to keep: left alone
    // in a sentence, the second sign starts where its hands are, not from rest
    const second = framesForItem({ frames, mirrored: false, fps: 25 }, f(0.2));
    expect(second).toHaveLength(TRANSITION_FRAMES + 2);
    expect(present(second[TRANSITION_FRAMES].lh)).toBe(true);
  });

  it("gives every frame its clip's body scale, and blends it between signs", () => {
    const frames = prepareFrames({ frames: [f(0.3), f(0.3), f(0.3)], mirrored: false, fps: 25 });
    expect(frames[0].body.shoulderWidth).toBeCloseTo(0.4);
    expect(frames[0].body.eyeHeight).toBeCloseTo(0.2);
    const a = { ...f(0.3), body: { shoulderWidth: 0.4, eyeHeight: 0.2 } };
    const b = { ...f(0.3), body: { shoulderWidth: 0.6, eyeHeight: 0.3 } };
    expect(lerpFrame(a, b, 0.5).body.shoulderWidth).toBeCloseTo(0.5);
    expect(bodyScale([{ pose: [] }])).toBeNull();
  });
});

describe("speech errors", () => {
  it("maps Web Speech errors to an action", () => {
    expect(describeWebSpeechError("no-speech").action).toBe("ignore");
    expect(describeWebSpeechError("not-allowed").action).toBe("stop");
    expect(describeWebSpeechError("network").action).toBe("fallback");
  });
  it("maps Whisper errors and microphone errors", () => {
    expect(describeWhisperError("transcription_failed").action).toBe("fallback");
    expect(describeWhisperError("not_configured").action).toBe("fallback");
    expect(describeWhisperError("mic-denied").action).toBe("stop");
    expect(micErrorCode({ name: "NotAllowedError" })).toBe("mic-denied");
    expect(micErrorCode({ name: "NotFoundError" })).toBe("mic-missing");
  });
});

describe("pickVoice", () => {
  const voices = [
    { voiceURI: "fr", lang: "fr-FR", default: true },
    { voiceURI: "en1", lang: "en-GB" },
    { voiceURI: "en2", lang: "en-US", default: true },
  ];
  it("prefers the saved voice, then the default voice for the language", () => {
    expect(pickVoice(voices, "en1", "en-US").voiceURI).toBe("en1");
    expect(pickVoice(voices, "gone", "en-US").voiceURI).toBe("en2");
    expect(pickVoice(voices, null, "de-DE").voiceURI).toBe("fr");
    expect(pickVoice([], null)).toBeNull();
  });
});

describe("topPredictions", () => {
  it("ranks probabilities against a label list or object", () => {
    const probs = new Float32Array([0.1, 0.7, 0.2]);
    expect(topPredictions(probs, ["a", "b", "c"]).map((p) => p.word)).toEqual(["b", "c", "a"]);
    expect(topPredictions(probs, { 0: "a", 1: "b", 2: "c" }, 1)[0].word).toBe("b");
  });
});

describe("legacyInputOf", () => {
  it("marks models trained before feature spec v2", () => {
    expect(legacyInputOf({ meta_data: { input_sequence_length: 10, label_dictionary: ["a"] } })).toEqual({ sequenceLength: 10 });
    expect(legacyInputOf({ meta_data: { feature_spec_version: 1, input_sequence_length: 30 } })).toEqual({ sequenceLength: 30 });
  });

  it("leaves newer models and unknown models alone", () => {
    expect(legacyInputOf({ meta_data: { feature_spec_version: 2, input_sequence_length: 64 } })).toBeNull();
    expect(legacyInputOf(null)).toBeNull();
    expect(legacyInputOf({})).toBeNull();
  });
});
