/**
 * Runs on the audio thread. Copies the first input channel and posts it to the main thread
 * in ~1024-sample batches (about 21 ms at 48 kHz). Must not import anything: it is loaded
 * as a separate module by audioWorklet.addModule() from useMicStream.js. It lives in public/
 * so the build ships it as a real file (Vite would inline it as a data: URL otherwise).
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.batch = new Float32Array(1024);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      let offset = 0;
      while (offset < channel.length) {
        const n = Math.min(channel.length - offset, this.batch.length - this.filled);
        this.batch.set(channel.subarray(offset, offset + n), this.filled);
        this.filled += n;
        offset += n;
        if (this.filled === this.batch.length) {
          this.port.postMessage(this.batch);
          this.batch = new Float32Array(1024);
          this.filled = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
