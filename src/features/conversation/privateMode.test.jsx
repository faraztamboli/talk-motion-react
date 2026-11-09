/**
 * Private mode (pharmacy and clinic locations): what is said stays on TalkMotion's servers
 * and the phones in the conversation. Backs the claim in
 * talkmotion server/docs/marketing/05-claims-register.md.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import reducer from "./state/conversationV2Slice";
import ConversationView from "./components/ConversationView";
import { pickLocalVoice } from "./hooks/useTTSPlayer";
import { FakeWebSocket, installFakeWebSocket } from "../../test/fakeWebSocket";

const mic = vi.hoisted(() => ({ props: null }));
const browserAsr = vi.hoisted(() => ({ props: null }));
const tts = vi.hoisted(() => ({ props: null }));

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
vi.mock("./hooks/useTTSPlayer", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: (props) => {
      tts.props = props;
      return { begin() {}, end() {}, speakText() {}, chunk() {}, unlock() {} };
    },
  };
});
vi.mock("./api", () => ({
  listUtterances: () => Promise.resolve({ items: [] }),
  endConversation: () => Promise.resolve(),
  fetchTranscript: () => Promise.resolve({ cues: [], words_deleted: false }),
  shareConversation: () => Promise.resolve({}),
  transcriptToText: () => "",
}));

const env = (type, payload) => ({ id: "x", type, conversation_id: "c1", payload });

function helloAck({ asrServerSide }) {
  return env("hello.ack", {
    participant_id: "me",
    role: "partner",
    display_name: "Pharmacist",
    is_owner: true,
    conversation: { settings: { private: true }, spoken_language: "en", words_grace_minutes: 15 },
    asr_provider: asrServerSide ? "kyutai" : "browser",
    asr_server_side: asrServerSide,
    tts_provider: "browser",
    llm_available: false,
    participants: [{ participant_id: "me", role: "partner", display_name: "Pharmacist", online: true }],
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

describe("private mode", () => {
  let restore;
  beforeEach(() => {
    restore = installFakeWebSocket();
    mic.props = browserAsr.props = tts.props = null;
  });
  afterEach(() => restore());

  it("says so, and speaks only with an on-device voice", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck({ asrServerSide: true })));
    expect(screen.getByText(/Private mode: what is said stays on TalkMotion's servers/).textContent).toMatch(
      /Its words are deleted .+ minutes after the conversation ends/ // {{n}} is filled in by i18next in the app
    );
    expect(tts.props.localVoiceOnly).toBe(true);
  });

  it("never falls back to the browser's recognizer", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck({ asrServerSide: true })));
    fireEvent.click(screen.getByRole("switch", { name: "Listen to speech" }));
    act(() => ws.serverSend(env("audio.ready", { provider: "kyutai" })));
    act(() => ws.serverSend(env("error", { code: "asr_unavailable", message: "Speech recognition is unavailable." })));
    expect(browserAsr.props.enabled).toBe(false);
    expect(ws.sentJson().some((m) => m.type === "caption.external")).toBe(false);
  });

  it("explains that captions are unavailable instead of using the browser", () => {
    const ws = renderView();
    act(() => ws.serverSend(helloAck({ asrServerSide: false })));
    expect(screen.queryByRole("switch", { name: "Listen to speech" })).toBeNull();
    expect(screen.getByText(/speech is never sent to an outside service/)).toBeTruthy();
    expect(browserAsr.props.enabled).toBe(false);
  });
});

describe("on-device voices", () => {
  const voices = [
    { name: "Google US English", lang: "en-US", localService: false, default: false },
    { name: "Microsoft Zira", lang: "en-US", localService: true, default: true },
    { name: "Samantha", lang: "en-US", localService: true, default: false },
  ];

  it("picks a local voice, never a network one", () => {
    expect(pickLocalVoice(voices, "en-US").name).toBe("Microsoft Zira");
    expect(pickLocalVoice([voices[0]], "en-US")).toBeNull();
    expect(pickLocalVoice([], "en-US")).toBeNull();
  });
});
