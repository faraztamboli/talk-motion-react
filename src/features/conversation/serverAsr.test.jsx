/**
 * Conversation screen with server-side speech recognition (e.g. self-hosted Kyutai):
 * the microphone streams only after audio.ready, and a server failure falls back to the
 * browser's own recognition.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import reducer from "./state/conversationV2Slice";
import ConversationView from "./components/ConversationView";
import { FakeWebSocket, installFakeWebSocket } from "../../test/fakeWebSocket";

const mic = vi.hoisted(() => ({ props: null }));
const browserAsr = vi.hoisted(() => ({ props: null }));

vi.mock("./hooks/useMicStream", () => ({
  default: (props) => {
    mic.props = props;
    return { supported: true, active: Boolean(props.enabled), level: 0.3, error: null };
  },
  micStreamSupported: () => true,
}));
vi.mock("./hooks/useBrowserASR", () => ({
  default: (props) => {
    browserAsr.props = props;
    return { supported: true, listening: Boolean(props.enabled), error: null };
  },
  browserASRSupported: () => true,
}));
vi.mock("./hooks/useTTSPlayer", () => ({
  default: () => ({ begin() {}, end() {}, speakText() {}, chunk() {}, unlock() {} }),
}));
vi.mock("./api", () => ({
  listUtterances: () => Promise.resolve({ items: [] }),
  endConversation: () => Promise.resolve(),
  fetchTranscript: () => Promise.resolve({ cues: [] }),
  shareConversation: () => Promise.resolve({}),
  transcriptToText: () => "",
}));

const env = (type, payload) => ({ id: "x", type, conversation_id: "c1", payload });

function helloAck(asrServerSide) {
  return env("hello.ack", {
    participant_id: "me",
    role: "partner",
    display_name: "Sam",
    is_owner: true,
    conversation: { settings: {}, spoken_language: "en" },
    asr_provider: asrServerSide ? "kyutai" : "browser",
    asr_server_side: asrServerSide,
    tts_provider: "browser",
    llm_available: false,
    participants: [{ participant_id: "me", role: "partner", display_name: "Sam", online: true }],
  });
}

function renderView() {
  const store = configureStore({ reducer: { conversationV2: reducer } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ConversationView conversationId="c1" getToken={() => "tok"} />
      </MemoryRouter>
    </Provider>
  );
  const ws = FakeWebSocket.instances[0];
  act(() => ws.serverOpen());
  return ws;
}

const sentTypes = (ws) => ws.sentJson().map((m) => m.type);
const binaryFrames = (ws) => ws.sent.filter((d) => d instanceof ArrayBuffer);

describe("ConversationView with server-side recognition", () => {
  let restore;
  beforeEach(() => {
    restore = installFakeWebSocket();
    mic.props = null;
    browserAsr.props = null;
  });
  afterEach(() => restore());

  it("streams the microphone only after the server is ready", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck(true)));
    expect(sentTypes(ws)).toContain("hello");

    fireEvent.click(screen.getByRole("switch"));
    expect(sentTypes(ws)).toContain("audio.start");
    expect(ws.sentJson().find((m) => m.type === "audio.start").payload).toEqual({ sample_rate: 16000 });
    expect(mic.props.enabled).toBe(true);
    expect(browserAsr.props.enabled).toBe(false);

    act(() => mic.props.onFrame(new ArrayBuffer(640)));
    expect(binaryFrames(ws)).toHaveLength(0); // not ready yet: dropped, never queued

    act(() => ws.serverSend(env("audio.ready", { provider: "kyutai" })));
    act(() => mic.props.onFrame(new ArrayBuffer(640)));
    expect(binaryFrames(ws)).toHaveLength(1);

    fireEvent.click(screen.getByRole("switch"));
    expect(sentTypes(ws)).toContain("audio.stop");
    expect(mic.props.enabled).toBe(false);
  });

  it("falls back to the browser's recognition when the server can't recognise speech", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck(true)));
    fireEvent.click(screen.getByRole("switch"));
    act(() => ws.serverSend(env("audio.ready", { provider: "kyutai" })));

    act(() => ws.serverSend(env("error", { code: "asr_unavailable", message: "Speech recognition is unavailable." })));
    expect(mic.props.enabled).toBe(false);
    expect(browserAsr.props.enabled).toBe(true);
    expect(sentTypes(ws).filter((t) => t === "audio.stop")).toHaveLength(1);

    act(() => browserAsr.props.onFinal("hello there", 0.9));
    const caption = ws.sentJson().find((m) => m.type === "caption.external");
    expect(caption.payload).toMatchObject({ text: "hello there", is_final: true });
  });

  it("uses browser recognition directly for browser-ASR conversations", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck(false)));
    fireEvent.click(screen.getByRole("switch"));
    expect(sentTypes(ws)).not.toContain("audio.start");
    expect(mic.props.enabled).toBe(false);
    expect(browserAsr.props.enabled).toBe(true);
  });
});
