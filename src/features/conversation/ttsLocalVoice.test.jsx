/**
 * Private mode must speak with an on-device voice even when private mode is learned after the
 * first render (hello.ack) and the language does not change.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useTTSPlayer from "./hooks/useTTSPlayer";

describe("useTTSPlayer in private mode", () => {
  let spoken;
  let voices;
  const original = { synth: globalThis.speechSynthesis, Utt: globalThis.SpeechSynthesisUtterance };

  beforeEach(() => {
    spoken = [];
    voices = [
      { name: "Google US English", lang: "en-US", localService: false, default: true },
      { name: "Samantha", lang: "en-US", localService: true, default: false },
    ];
    globalThis.SpeechSynthesisUtterance = function Utterance(text) {
      this.text = text;
    };
    globalThis.speechSynthesis = {
      speaking: false,
      getVoices: () => voices,
      speak: vi.fn((u) => {
        spoken.push(u);
        u.onend?.();
      }),
      cancel: vi.fn(),
    };
  });

  afterEach(() => {
    globalThis.speechSynthesis = original.synth;
    globalThis.SpeechSynthesisUtterance = original.Utt;
  });

  it("uses a local voice once private mode turns on, with the same language", () => {
    const { result, rerender } = renderHook((props) => useTTSPlayer(props), {
      initialProps: { lang: "en-US", localVoiceOnly: false },
    });
    rerender({ lang: "en-US", localVoiceOnly: true });
    act(() => result.current.speakText({ text: "Thank you", utterance_id: 1 }));
    expect(spoken).toHaveLength(1);
    expect(spoken[0].voice.name).toBe("Samantha");
  });

  it("stays silent rather than use a network voice", () => {
    voices = [{ name: "Google US English", lang: "en-US", localService: false, default: true }];
    const { result } = renderHook(() => useTTSPlayer({ lang: "en-US", localVoiceOnly: true }));
    act(() => result.current.speakText({ text: "Thank you", utterance_id: 2 }));
    expect(spoken).toHaveLength(0);
  });
});
