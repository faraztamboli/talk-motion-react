import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const rpcMock = vi.hoisted(() => ({ rpc: vi.fn(), hasRpc: vi.fn(() => true) }));
vi.mock("../../api/rpc", () => ({
  rpc: (...args) => rpcMock.rpc(...args),
  hasRpc: (...args) => rpcMock.hasRpc(...args),
  sessionToken: () => "tok",
  rpcErrorMessage: (err, fallback) => err?.message || fallback,
}));
vi.mock("./useBrowserModel", () => ({ default: () => ({ status: "server", ready: false, predict: vi.fn() }) }));

const whisperMock = vi.hoisted(() => ({ supported: false, onUtterance: null, start: null, stop: null }));
vi.mock("./useWhisperCapture", () => ({
  default: ({ onUtterance }) => {
    whisperMock.onUtterance = onUtterance;
    return { start: whisperMock.start, stop: whisperMock.stop, active: false };
  },
  whisperSupported: () => whisperMock.supported,
}));

import useSignRecognizer from "./useSignRecognizer";
import useSpeechInput from "./useSpeechInput";
import useSignVideoQueue from "./useSignVideoQueue";
import useSpeechOutput from "./useSpeechOutput";

const hand = (x, y = 0.5) => ({ rightHandLandmarks: [{ x, y, z: 0 }] });
const noHands = { poseLandmarks: [] };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** One sign: movement then stillness, frames 33 ms apart starting at t0. Returns the next t. */
function signOnce(result, t0 = 0, start = 0.2, step = 0.02) {
  let t = t0;
  act(() => {
    for (let i = 0; i < 14; i++) result.current.onFrame(hand(start + i * step), { timestamp: (t += 33) });
    for (let i = 0; i < 8; i++) result.current.onFrame(hand(start + 13 * step), { timestamp: (t += 33) });
  });
  return t;
}

function handsDown(result, t0, ms) {
  let t = t0;
  act(() => {
    while (t < t0 + ms) result.current.onFrame(noHands, { timestamp: (t += 33) });
  });
  return t;
}

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useSignRecognizer", () => {
  beforeEach(() => {
    rpcMock.hasRpc.mockReturnValue(true);
  });

  it("turns a sign into a word and sends the sentence after a pause", async () => {
    rpcMock.rpc.mockImplementation(async (name) => {
      if (name === "translateGestureSample") return { predictions: [{ word: "hello", confidence: 0.9 }] };
      if (name === "smoothGlossToEnglish") return { text: "Hello!" };
      return null;
    });
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: true, idleMs: 400, onSentence }));
    let t = signOnce(result);
    await waitFor(() => expect(result.current.words.map((w) => w.word)).toEqual(["hello"]));
    expect(rpcMock.rpc).toHaveBeenCalledWith("translateGestureSample", ["tok", "7", expect.any(Array)]);
    t = handsDown(result, t, 600);
    await waitFor(() => expect(onSentence).toHaveBeenCalledWith("Hello!", ["hello"]));
    expect(result.current.words).toEqual([]);
  });

  it("with auto-send off, waits for Send", async () => {
    rpcMock.rpc.mockImplementation(async (name) =>
      name === "translateGestureSample" ? { predictions: [{ word: "yes", confidence: 0.9 }] } : { text: "Yes." }
    );
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: false, idleMs: 300, onSentence }));
    const t = signOnce(result);
    await waitFor(() => expect(result.current.words).toHaveLength(1));
    handsDown(result, t, 800);
    expect(onSentence).not.toHaveBeenCalled();
    act(() => result.current.send());
    await waitFor(() => expect(onSentence).toHaveBeenCalledWith("Yes.", ["yes"]));
  });

  it("Send waits for a prediction still in flight and includes it", async () => {
    const pending = deferred();
    rpcMock.rpc.mockImplementation((name) =>
      name === "translateGestureSample" ? pending.promise : Promise.resolve({ text: "Thank you." })
    );
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: false, onSentence }));
    signOnce(result);
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    act(() => result.current.send());
    expect(onSentence).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ predictions: [{ word: "thank-you", confidence: 0.8 }] }));
    await waitFor(() => expect(onSentence).toHaveBeenCalledWith("Thank you.", ["thank-you"]));
  });

  it("Clear drops a late answer instead of adding it to the next sentence", async () => {
    const pending = deferred();
    rpcMock.rpc.mockImplementation(() => pending.promise);
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: false }));
    signOnce(result);
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    act(() => result.current.clear());
    expect(result.current.pendingCount).toBe(0);
    await act(async () => pending.resolve({ predictions: [{ word: "late", confidence: 0.99 }] }));
    expect(result.current.words).toEqual([]);
  });

  it("shows a recognition failure and keeps working", async () => {
    rpcMock.rpc.mockRejectedValueOnce(Object.assign(new Error("The server took too long to answer."), { code: "timeout" }));
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: false }));
    signOnce(result);
    await waitFor(() => expect(result.current.error).toBe("The server took too long to answer."));
    expect(result.current.pendingCount).toBe(0);
  });

  it("speaks the raw gloss when smoothing is unavailable", async () => {
    rpcMock.hasRpc.mockImplementation((name) => name !== "smoothGlossToEnglish");
    rpcMock.rpc.mockResolvedValue({ predictions: [{ word: "good", confidence: 0.9 }] });
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSignRecognizer({ modelId: "7", autoSend: false, onSentence }));
    signOnce(result);
    await waitFor(() => expect(result.current.words).toHaveLength(1));
    act(() => result.current.send());
    await waitFor(() => expect(onSentence).toHaveBeenCalledWith("good", ["good"]));
  });

  it("a different model starts the sentence over", async () => {
    rpcMock.rpc.mockResolvedValue({ predictions: [{ word: "a", confidence: 0.9 }] });
    const { result, rerender } = renderHook(({ modelId }) => useSignRecognizer({ modelId, autoSend: false }), {
      initialProps: { modelId: "1" },
    });
    signOnce(result);
    await waitFor(() => expect(result.current.words).toHaveLength(1));
    rerender({ modelId: "2" });
    expect(result.current.words).toEqual([]);
  });
});

class FakeRecognition {
  static instances = [];
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.abort = vi.fn();
    FakeRecognition.instances.push(this);
  }
  final(text) {
    this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal: true })] });
  }
}

describe("useSpeechInput", () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    window.webkitSpeechRecognition = FakeRecognition;
    whisperMock.supported = false;
    whisperMock.start = vi.fn(async () => {});
    whisperMock.stop = vi.fn();
    rpcMock.hasRpc.mockReturnValue(true);
  });
  afterEach(() => {
    delete window.webkitSpeechRecognition;
  });

  it("listens with the browser engine and passes finished sentences on", async () => {
    const onFinal = vi.fn();
    const { result } = renderHook(() => useSpeechInput({ language: "en-US", onFinal }));
    await act(async () => result.current.start());
    expect(result.current.engine).toBe("webspeech");
    expect(result.current.status).toBe("listening");
    const rec = FakeRecognition.instances.at(-1);
    expect(rec.lang).toBe("en-US");
    act(() => rec.final(" hello there "));
    expect(onFinal).toHaveBeenCalledWith("hello there");
  });

  it("says why when the microphone is blocked", async () => {
    const { result } = renderHook(() => useSpeechInput({ onFinal: vi.fn() }));
    await act(async () => result.current.start());
    act(() => FakeRecognition.instances.at(-1).onerror({ error: "not-allowed" }));
    expect(result.current.error).toMatch(/Microphone access is blocked/);
    expect(result.current.status).toBe("idle");
  });

  it("restarts when the browser ends recognition on its own", async () => {
    const { result } = renderHook(() => useSpeechInput({ onFinal: vi.fn() }));
    await act(async () => result.current.start());
    const rec = FakeRecognition.instances.at(-1);
    expect(rec.start).toHaveBeenCalledTimes(1);
    act(() => rec.onend());
    expect(rec.start).toHaveBeenCalledTimes(2);
  });

  it("pauses while text-to-speech talks and resumes after", async () => {
    const { result, rerender } = renderHook(({ suspended }) => useSpeechInput({ onFinal: vi.fn(), suspended }), {
      initialProps: { suspended: false },
    });
    await act(async () => result.current.start());
    const first = FakeRecognition.instances.at(-1);
    rerender({ suspended: true });
    expect(first.abort).toHaveBeenCalled();
    expect(result.current.status).toBe("paused");
    rerender({ suspended: false });
    expect(FakeRecognition.instances.length).toBeGreaterThan(1);
    expect(result.current.status).toBe("listening");
  });

  it("explains when no speech recognition exists", async () => {
    delete window.webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeechInput({ onFinal: vi.fn() }));
    expect(result.current.supported).toBe(false);
    await act(async () => result.current.start());
    expect(result.current.error).toMatch(/isn't available in this browser/);
  });

  it("uses server transcription when offered and falls back to the browser when it fails", async () => {
    whisperMock.supported = true;
    rpcMock.rpc.mockImplementation(async (name) => {
      if (name === "getSpeechCapabilities") return { whisper: true };
      if (name === "transcribeAudio") return { text: null, error: "transcription_failed" };
      return null;
    });
    const onFinal = vi.fn();
    const { result } = renderHook(() => useSpeechInput({ language: "en-US", onFinal }));
    await act(async () => result.current.start());
    expect(result.current.engine).toBe("whisper");
    expect(whisperMock.start).toHaveBeenCalled();
    await act(async () => whisperMock.onUtterance(new Blob(["x".repeat(2000)], { type: "audio/webm" })));
    await waitFor(() => expect(result.current.engine).toBe("webspeech"));
    expect(result.current.notice).toMatch(/browser's speech recognition/);
    expect(whisperMock.stop).toHaveBeenCalled();
    expect(FakeRecognition.instances.at(-1).start).toHaveBeenCalled();
    expect(rpcMock.rpc).toHaveBeenCalledWith("transcribeAudio", ["tok", expect.any(String), "audio/webm", "en"], { raw: true });
  });

  it("passes server transcripts on", async () => {
    whisperMock.supported = true;
    rpcMock.rpc.mockImplementation(async (name) =>
      name === "getSpeechCapabilities" ? { whisper: true } : { text: " Good morning ", source: "whisper" }
    );
    const onFinal = vi.fn();
    const { result } = renderHook(() => useSpeechInput({ onFinal }));
    await act(async () => result.current.start());
    await act(async () => whisperMock.onUtterance(new Blob(["y".repeat(2000)], { type: "audio/webm" })));
    await waitFor(() => expect(onFinal).toHaveBeenCalledWith("Good morning"));
  });
});

describe("useSignVideoQueue", () => {
  function fakeVideo() {
    return {
      src: "",
      playbackRate: 1,
      muted: false,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      load: vi.fn(),
      removeAttribute: vi.fn(),
    };
  }
  const items = [
    { id: "1", label: "hello", url: "u1" },
    { id: "2", label: "you", url: "u2" },
  ];

  it("plays items in order, skips broken clips, stops and replays", () => {
    const { result } = renderHook(() => useSignVideoQueue());
    const video = fakeVideo();
    result.current.videoRef.current = video;
    act(() => result.current.enqueue(items));
    expect(video.src).toBe("u1");
    expect(video.muted).toBe(true);
    expect(video.play).toHaveBeenCalled();
    act(() => result.current.onError());
    expect(result.current.failed).toEqual(["hello"]);
    expect(video.src).toBe("u2");
    act(() => result.current.onEnded());
    expect(result.current.playing).toBe(false);
    act(() => result.current.replay());
    expect(result.current.current.label).toBe("hello");
    act(() => result.current.stop());
    expect(video.removeAttribute).toHaveBeenCalledWith("src");
    expect(result.current.playing).toBe(false);
  });

  it("changes speed live and remembers it", () => {
    const { result } = renderHook(() => useSignVideoQueue());
    const video = fakeVideo();
    result.current.videoRef.current = video;
    act(() => result.current.setSpeed(1.5));
    expect(video.playbackRate).toBe(1.5);
    expect(localStorage.getItem("tm_translator_speed")).toBe("1.5");
  });

  it("asks for a tap only when autoplay is refused", async () => {
    const { result } = renderHook(() => useSignVideoQueue());
    const video = fakeVideo();
    video.play = vi.fn(() => Promise.reject(Object.assign(new Error("no"), { name: "NotAllowedError" })));
    result.current.videoRef.current = video;
    act(() => result.current.enqueue(items));
    await waitFor(() => expect(result.current.needsTap).toBe(true));
  });
});

describe("useSpeechOutput", () => {
  let synth;
  beforeEach(() => {
    const listeners = {};
    synth = {
      voices: [],
      getVoices: vi.fn(() => synth.voices),
      speak: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn((type, fn) => (listeners[type] = fn)),
      removeEventListener: vi.fn(),
      fire: (type) => listeners[type]?.(),
    };
    window.speechSynthesis = synth;
    window.SpeechSynthesisUtterance = function Utterance(text) {
      this.text = text;
    };
  });
  afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it("picks up voices that load late and speaks with the chosen volume", () => {
    const { result } = renderHook(() => useSpeechOutput({ lang: "en-US" }));
    expect(result.current.voices).toEqual([]);
    synth.voices = [{ voiceURI: "v1", name: "One", lang: "en-US", default: true }];
    act(() => synth.fire("voiceschanged"));
    expect(result.current.voice.voiceURI).toBe("v1");
    act(() => {
      result.current.speak("Hello", 0.4);
    });
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance).toMatchObject({ text: "Hello", volume: 0.4, lang: "en-US" });
    expect(result.current.speaking).toBe(true);
    act(() => utterance.onend());
    expect(result.current.speaking).toBe(false);
  });

  it("speaks the same sentence twice", () => {
    const { result } = renderHook(() => useSpeechOutput());
    act(() => {
      result.current.speak("Again");
      result.current.speak("Again");
    });
    expect(synth.speak).toHaveBeenCalledTimes(2);
  });

  it("cancels speech on stop and when the page goes away", () => {
    const { result, unmount } = renderHook(() => useSpeechOutput());
    act(() => result.current.stop());
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    unmount();
    expect(synth.cancel).toHaveBeenCalledTimes(2);
  });

  it("degrades to text when the browser can't speak", () => {
    delete window.speechSynthesis;
    const { result } = renderHook(() => useSpeechOutput());
    expect(result.current.supported).toBe(false);
    expect(result.current.speak("x")).toBe(false);
  });
});
