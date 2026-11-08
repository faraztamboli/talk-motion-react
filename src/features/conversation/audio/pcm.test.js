import { describe, expect, it } from "vitest";
import {
  FRAME_SAMPLES,
  createDownsampler,
  createFramer,
  createPcmPipeline,
  floatToPcm16,
  rmsLevel,
} from "./pcm";

function feedInChunks(fn, input, size) {
  const out = [];
  for (let i = 0; i < input.length; i += size) out.push(...fn(input.subarray(i, i + size)));
  return out;
}

describe("createDownsampler", () => {
  it("turns one second at 48 kHz into exactly one second at 16 kHz, across chunk boundaries", () => {
    const input = new Float32Array(48000).fill(0.5);
    const out = feedInChunks(createDownsampler(48000), input, 1000);
    expect(out).toHaveLength(16000);
    expect(out.every((v) => Math.abs(v - 0.5) < 1e-6)).toBe(true);
  });

  it("averages the input samples each output covers", () => {
    const down = createDownsampler(48000);
    expect(Array.from(down(Float32Array.from([0, 1])))).toEqual([]);
    expect(Array.from(down(Float32Array.from([2, 3, 4, 5])))).toEqual([1, 4]);
  });

  it("handles a non-integer ratio such as 44.1 kHz", () => {
    const out = feedInChunks(createDownsampler(44100), new Float32Array(44100), 128);
    expect(Math.abs(out.length - 16000)).toBeLessThanOrEqual(1);
  });

  it("passes 16 kHz through and refuses to upsample", () => {
    expect(Array.from(createDownsampler(16000)(Float32Array.from([0.1, 0.2])))).toEqual([
      Math.fround(0.1),
      Math.fround(0.2),
    ]);
    expect(() => createDownsampler(8000)).toThrow(/upsample/);
  });
});

describe("floatToPcm16", () => {
  it("scales and clips", () => {
    expect(Array.from(floatToPcm16(Float32Array.from([0, 1, -1, 2, -2, 0.5])))).toEqual([
      0, 32767, -32768, 32767, -32768, 16384,
    ]);
  });
});

describe("createFramer", () => {
  it("emits whole 20 ms frames as little-endian bytes and keeps the remainder", () => {
    const frame = createFramer();
    const first = Int16Array.from({ length: 500 }, (_, i) => i - 250);
    const frames = frame(first);
    expect(frames).toHaveLength(1);
    expect(frames[0].byteLength).toBe(FRAME_SAMPLES * 2);
    const view = new DataView(frames[0]);
    expect(view.getInt16(0, true)).toBe(-250);
    expect(view.getInt16((FRAME_SAMPLES - 1) * 2, true)).toBe(FRAME_SAMPLES - 1 - 250);

    const more = frame(new Int16Array(200)); // 180 pending + 200 = one more frame, 60 left
    expect(more).toHaveLength(1);
    expect(new DataView(more[0]).getInt16(0, true)).toBe(70); // first pending sample
  });
});

describe("createPcmPipeline", () => {
  it("turns 20 ms of 48 kHz float audio into one 640-byte frame", () => {
    const frames = createPcmPipeline(48000)(new Float32Array(960).fill(0.25));
    expect(frames).toHaveLength(1);
    expect(frames[0].byteLength).toBe(640);
    expect(new DataView(frames[0]).getInt16(0, true)).toBe(Math.round(0.25 * 32767));
  });
});

describe("rmsLevel", () => {
  it("measures loudness", () => {
    expect(rmsLevel(Float32Array.from([0.5, -0.5]))).toBeCloseTo(0.5);
    expect(rmsLevel(new Float32Array(0))).toBe(0);
  });
});
