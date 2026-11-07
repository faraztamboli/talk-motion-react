import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import reducer, { conversationOpened } from "./state/conversationV2Slice";
import { dispatchEnvelope, speechIdHex } from "./protocol";
import useConversationSocket, { backoffDelay } from "./hooks/useConversationSocket";
import useTTSPlayer from "./hooks/useTTSPlayer";
import ComposeTray from "./components/ComposeTray";
import { FakeWebSocket, installFakeWebSocket } from "../../test/fakeWebSocket";

function store() {
  const s = configureStore({ reducer: { conversationV2: reducer } });
  s.dispatch(conversationOpened("c1"));
  return s;
}

const env = (type, payload) => ({ id: "x", type, conversation_id: "c1", payload });

// ---------------------------------------------------------------------------- state

describe("conversation state", () => {
  it("maps server messages into the store", () => {
    const s = store();
    const d = (type, payload) => dispatchEnvelope(s.dispatch, env(type, payload));

    d("hello.ack", {
      participant_id: "me",
      role: "primary",
      display_name: "Dana",
      is_owner: true,
      conversation: { settings: { plain_language: true } },
      asr_provider: "browser",
      asr_server_side: false,
      tts_provider: "browser",
      llm_available: true,
      participants: [{ participant_id: "me", role: "primary", display_name: "Dana", online: true }],
    });
    d("participant.joined", { participant_id: "p2", role: "partner", display_name: "Sam" });
    d("utterance.partial", { participant_id: "p2", text: "how can" });
    expect(s.getState().conversationV2.partials.p2).toBe("how can");

    d("utterance.final", { id: 2, participant_id: "p2", text: "How can I help?", source: "speech" });
    d("utterance.final", { id: 2, participant_id: "p2", text: "How can I help?", source: "speech" }); // duplicate
    d("utterance.final", { id: 1, participant_id: "me", text: "Hello", source: "typed" });
    d("utterance.enrich", { utterance_id: 2, plain_text: "Plain" });

    const state = s.getState().conversationV2;
    expect(state.me).toMatchObject({ participantId: "me", isOwner: true });
    expect(state.llmAvailable).toBe(true);
    expect(state.participants.p2).toMatchObject({ displayName: "Sam", online: true });
    expect(state.partials.p2).toBeUndefined(); // final replaces the partial
    expect(state.utterances.map((u) => u.id)).toEqual([1, 2]); // ordered, no duplicates
    expect(state.utterances[1].plain_text).toBe("Plain");

    d("participant.left", { participant_id: "p2", role: "partner", display_name: "Sam" });
    expect(s.getState().conversationV2.participants.p2.online).toBe(false);
    d("conversation.ended", {});
    expect(s.getState().conversationV2.ended).toBe(true);
  });

  it("ignores audio control messages (the player handles them)", () => {
    const s = store();
    expect(dispatchEnvelope(s.dispatch, env("speak.start", {}))).toBe(false);
  });

  it("reads speech ids from UUID strings and binary frames alike", () => {
    const id = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
    const bytes = new Uint8Array(20);
    id.replace(/-/g, "").match(/../g).forEach((h, i) => (bytes[i] = parseInt(h, 16)));
    expect(speechIdHex(bytes.buffer)).toBe(speechIdHex(id));
  });
});

// ---------------------------------------------------------------------------- socket

describe("useConversationSocket", () => {
  let restore;
  beforeEach(() => {
    restore = installFakeWebSocket();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    restore();
  });

  function setup(overrides = {}) {
    const props = {
      conversationId: "c1",
      getToken: () => "tok",
      onMessage: vi.fn(),
      onBinary: vi.fn(),
      onOpen: vi.fn(),
      onStatus: vi.fn(),
      ...overrides,
    };
    const hook = renderHook(() => useConversationSocket(props));
    return { hook, props };
  }

  it("connects with the token, queues while connecting, and flushes on open", () => {
    const { hook, props } = setup();
    const ws = FakeWebSocket.instances[0];
    expect(ws.url).toContain("/ws/conversations/c1?token=tok");
    expect(ws.binaryType).toBe("arraybuffer");

    act(() => {
      hook.result.current.send("typing.state", { is_typing: true });
    });
    act(() => ws.serverOpen());
    expect(ws.sentJson().map((m) => m.type)).toEqual(["typing.state"]);
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe("open");

    act(() => ws.serverSend({ type: "utterance.final", payload: { id: 1 } }));
    expect(props.onMessage).toHaveBeenCalledWith({ type: "utterance.final", payload: { id: 1 } });
    const buf = new ArrayBuffer(4);
    act(() => ws.serverSendBinary(buf));
    expect(props.onBinary).toHaveBeenCalledWith(buf);
  });

  it("reconnects after a dropped connection", () => {
    const { hook } = setup();
    act(() => FakeWebSocket.instances[0].serverOpen());
    act(() => FakeWebSocket.instances[0].serverClose(1006));
    expect(hook.result.current.status).toBe("reconnecting");
    act(() => vi.advanceTimersByTime(1000));
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("does not retry when the conversation ended or access was refused", () => {
    for (const code of [4409, 4403, 4404]) {
      FakeWebSocket.instances = [];
      const { hook } = setup();
      act(() => FakeWebSocket.instances[0].serverClose(code));
      act(() => vi.advanceTimersByTime(60000));
      expect(FakeWebSocket.instances).toHaveLength(1);
      expect(hook.result.current.status).toBe("closed");
      hook.unmount();
    }
  });

  it("guests stop on 401 instead of refreshing", () => {
    const { hook } = setup({ canRefresh: false });
    act(() => FakeWebSocket.instances[0].serverClose(4401));
    expect(hook.result.current.status).toBe("closed");
  });

  it("closes cleanly on unmount", () => {
    const { hook } = setup();
    const ws = FakeWebSocket.instances[0];
    hook.unmount();
    expect(ws.closedWith).toBe(1000);
  });

  it("backs off exponentially up to 30 s", () => {
    expect(backoffDelay(0, () => 1)).toBe(1000);
    expect(backoffDelay(3, () => 1)).toBe(8000);
    expect(backoffDelay(10, () => 1)).toBe(30000);
    expect(backoffDelay(10, () => 0)).toBe(15000);
  });
});

// ---------------------------------------------------------------------------- compose

describe("ComposeTray", () => {
  const suggestions = { draftId: "d1", items: [{ text: "Yes, please." }, { text: "Could you repeat that?" }] };

  function setup(props = {}) {
    const handlers = { onSpeak: vi.fn(), onReject: vi.fn(), onTyping: vi.fn(), onRequestSuggestions: vi.fn() };
    render(<ComposeTray {...handlers} llmAvailable suggestions={null} {...props} />);
    return handlers;
  }

  const box = () => screen.getByRole("textbox");

  it("speaks only when asked, with Enter or the Speak button", () => {
    const h = setup();
    fireEvent.change(box(), { target: { value: "I need my prescription" } });
    expect(h.onTyping).toHaveBeenCalledWith(true);
    expect(h.onSpeak).not.toHaveBeenCalled();

    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    expect(h.onSpeak).not.toHaveBeenCalled();

    fireEvent.keyDown(box(), { key: "Enter" });
    expect(h.onSpeak).toHaveBeenCalledWith({ text: "I need my prescription", draft: null });
    expect(box()).toHaveValue("");
    expect(h.onTyping).toHaveBeenLastCalledWith(false);
  });

  it("a suggestion fills the box but is never spoken by itself", () => {
    const h = setup({ suggestions });
    fireEvent.click(screen.getByRole("button", { name: "Yes, please." }));
    expect(box()).toHaveValue("Yes, please.");
    expect(h.onSpeak).not.toHaveBeenCalled();

    fireEvent.change(box(), { target: { value: "Yes, please. Today." } });
    fireEvent.click(screen.getByRole("button", { name: /speak/i }));
    expect(h.onSpeak).toHaveBeenCalledWith({
      text: "Yes, please. Today.",
      draft: { text: "Yes, please.", draftId: "d1" },
    });
  });

  it("dismissing suggestions reports each as rejected", () => {
    const h = setup({ suggestions });
    fireEvent.click(screen.getByRole("button", { name: /not these/i }));
    expect(h.onReject).toHaveBeenCalledTimes(2);
    expect(h.onReject).toHaveBeenCalledWith({ text: "Could you repeat that?", draftId: "d1" });
  });

  it("disables speaking while offline", () => {
    setup({ disabled: true });
    expect(screen.getByRole("button", { name: /speak/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------- audio

describe("useTTSPlayer", () => {
  let played;
  beforeEach(() => {
    played = [];
    vi.stubGlobal(
      "Audio",
      class {
        play() {
          played.push(this.src);
          setTimeout(() => this.onended?.(), 0);
          return Promise.resolve();
        }
        pause() {}
      }
    );
    vi.stubGlobal("speechSynthesis", { speak: vi.fn((u) => setTimeout(() => u.onend?.(), 0)), cancel: vi.fn(), speaking: false });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(text) {
          this.text = text;
        }
      }
    );
    URL.createObjectURL = vi.fn(() => "blob:audio");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  const speechId = "00112233-4455-6677-8899-aabbccddeeff";
  const frame = (bytes) => {
    const out = new Uint8Array(16 + bytes.length);
    speechId.replace(/-/g, "").match(/../g).forEach((h, i) => (out[i] = parseInt(h, 16)));
    out.set(bytes, 16);
    return out.buffer;
  };

  it("assembles streamed audio for its speech id and plays it", () => {
    const onStart = vi.fn();
    const { result } = renderHook(() => useTTSPlayer({ onStart }));
    act(() => {
      result.current.begin({ speech_id: speechId, mime_type: "audio/mpeg", utterance_id: 7 });
      result.current.chunk(frame(new Uint8Array([1, 2, 3])));
      result.current.chunk(frame(new Uint8Array([4])));
      result.current.end({ speech_id: speechId, text: "Hello", utterance_id: 7 });
    });
    expect(played).toEqual(["blob:audio"]);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.size).toBe(4);
    expect(onStart).toHaveBeenCalledWith({ utteranceId: 7, text: "Hello" });
  });

  it("falls back to the browser voice", () => {
    const { result } = renderHook(() => useTTSPlayer({ lang: "en-GB" }));
    act(() => result.current.speakText({ text: "Thank you", utterance_id: 3 }));
    const spoken = globalThis.speechSynthesis.speak.mock.calls[0][0];
    expect(spoken.text).toBe("Thank you");
    expect(spoken.lang).toBe("en-GB");
  });
});
