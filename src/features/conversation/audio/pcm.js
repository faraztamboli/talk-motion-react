/**
 * Microphone audio for server-side speech recognition.
 * Wire format (server/docs/architecture/11-phase1-conversation-mode.md): PCM16 little-endian,
 * mono, 16 kHz, one binary WebSocket frame per 20 ms (320 samples, 640 bytes).
 */

export const TARGET_RATE = 16000;
export const FRAME_SAMPLES = 320; // 20 ms at 16 kHz

/**
 * Streaming downsampler. Each output sample is the average of the input samples it covers,
 * a box filter that keeps most aliasing out of speech without a DSP library.
 * Returns a function that takes a Float32Array chunk and returns the 16 kHz samples ready so far.
 */
export function createDownsampler(inputRate, outputRate = TARGET_RATE) {
  if (inputRate === outputRate) return (input) => Float32Array.from(input);
  if (inputRate < outputRate) throw new Error(`cannot upsample ${inputRate} Hz to ${outputRate} Hz`);
  const ratio = inputRate / outputRate;
  let next = ratio; // input index (within this chunk's frame of reference) where the current output ends
  let sum = 0;
  let count = 0;
  return (input) => {
    const out = [];
    let pos = 0;
    for (let i = 0; i < input.length; i += 1) {
      sum += input[i];
      count += 1;
      pos += 1;
      if (pos >= next) {
        out.push(sum / count);
        sum = 0;
        count = 0;
        next += ratio;
      }
    }
    next -= pos; // carry the fractional boundary into the next chunk
    return Float32Array.from(out);
  };
}

/** Float [-1, 1] to signed 16-bit, clipping out-of-range samples. */
export function floatToPcm16(input) {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
  }
  return out;
}

/** Collects PCM16 samples and returns whole frames as little-endian ArrayBuffers. */
export function createFramer(frameSamples = FRAME_SAMPLES) {
  let pending = new Int16Array(0);
  return (samples) => {
    const all = new Int16Array(pending.length + samples.length);
    all.set(pending);
    all.set(samples, pending.length);
    const frames = [];
    let offset = 0;
    while (all.length - offset >= frameSamples) {
      const view = new DataView(new ArrayBuffer(frameSamples * 2));
      for (let i = 0; i < frameSamples; i += 1) view.setInt16(i * 2, all[offset + i], true);
      frames.push(view.buffer);
      offset += frameSamples;
    }
    pending = all.slice(offset);
    return frames;
  };
}

/** Root-mean-square level of a chunk, 0..1, for a microphone level meter. */
export function rmsLevel(input) {
  if (!input.length) return 0;
  let total = 0;
  for (let i = 0; i < input.length; i += 1) total += input[i] * input[i];
  return Math.sqrt(total / input.length);
}

/**
 * The whole browser-side chain: float chunks at the device rate in, 20 ms PCM16 frames out.
 */
export function createPcmPipeline(inputRate) {
  const downsample = createDownsampler(inputRate);
  const frame = createFramer();
  return (chunk) => frame(floatToPcm16(downsample(chunk)));
}
