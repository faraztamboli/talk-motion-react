/**
 * Sign input in Conversation Mode (doc 13, M1): recognized signs become an English draft from
 * the conversation's language layer, nothing is spoken until the signer taps, and every draft
 * outcome is sent with its modality, model version, confidence and latency (M0).
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import reducer from "./state/conversationV2Slice";
import ConversationView, { draftTimings } from "./components/ConversationView";
import { FakeWebSocket, installFakeWebSocket } from "../../test/fakeWebSocket";

const recognizer = vi.hoisted(() => ({ props: null, api: null }));
const landmarker = vi.hoisted(() => ({ api: null }));

vi.mock("./hooks/useMicStream", () => ({
  default: () => ({ supported: true, active: false, level: 0, error: null }),
  micStreamSupported: () => true,
}));
vi.mock("./hooks/useBrowserASR", () => ({
  default: () => ({ supported: true, listening: false, error: null }),
  browserASRSupported: () => true,
}));
vi.mock("./hooks/useTTSPlayer", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: () => ({ begin() {}, end() {}, speakText() {}, chunk() {}, unlock() {} }) };
});
vi.mock("./api", () => ({
  listUtterances: () => Promise.resolve({ items: [] }),
  endConversation: () => Promise.resolve(),
  fetchTranscript: () => Promise.resolve({ cues: [], words_deleted: false }),
  shareConversation: () => Promise.resolve({}),
  transcriptToText: () => "",
}));
vi.mock("../signInput/useSignRecognizer", () => ({
  default: (props) => {
    recognizer.props = props;
    return recognizer.api;
  },
}));
vi.mock("../landmarks/useLandmarker", () => ({ default: () => landmarker.api }));
vi.mock("../landmarks/LandmarkerView", () => ({ default: () => null }));
vi.mock("../models/ModelPicker", () => ({ default: () => <span>model picker</span> }));

const env = (type, payload) => ({ id: "x", type, conversation_id: "c1", payload });

const helloAck = env("hello.ack", {
  participant_id: "me",
  role: "primary",
  display_name: "Dana",
  is_owner: true,
  conversation: { settings: {}, spoken_language: "en" },
  asr_provider: "browser",
  asr_server_side: false,
  tts_provider: "elevenlabs",
  llm_available: true,
  participants: [{ participant_id: "me", role: "primary", display_name: "Dana", online: true }],
});

function renderView({ signInput = true } = {}) {
  const store = configureStore({
    reducer: {
      conversationV2: reducer,
      flags: () => ({ values: { sign_input: signInput } }),
      login: () => ({ isLoggedIn: true }),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ConversationView conversationId="c1" getToken={() => "tok"} />
      </MemoryRouter>
    </Provider>
  );
  const ws = FakeWebSocket.instances[0];
  act(() => ws.serverOpen());
  act(() => ws.serverSend(helloAck));
  return ws;
}

const sent = (ws, type) => ws.sentJson().filter((m) => m.type === type);

async function openTray() {
  fireEvent.click(screen.getByRole("button", { name: "Sign" }));
  return screen.findByRole("region", { name: "Sign to speak" }); // the tray is lazy-loaded
}

function signSentence(text = "Yes, a bag please.", gloss = ["yes", "bag"], meta = {}) {
  act(() =>
    recognizer.props.onSentence(text, gloss, {
      modelVersion: "legacy:7",
      confidence: 0.8,
      recognizeMs: 200,
      englishMs: 700,
      draftId: "d1",
      ...meta,
    })
  );
}

describe("sign input in Conversation Mode", () => {
  let restore;
  beforeEach(() => {
    restore = installFakeWebSocket();
    const fn = () => {};
    recognizer.props = null;
    recognizer.api = {
      onFrame: fn, words: [], pendingCount: 0, lastMiss: null, error: null, signing: false, sending: false,
      send: fn, clear: fn, reset: fn, undo: fn, remove: fn, choose: fn, confirm: fn, dismissError: fn,
      recognitionMode: "server", fullFace: false,
    };
    landmarker.api = { isActive: false, status: "idle", start: vi.fn(), stop: vi.fn() };
  });
  afterEach(() => restore());

  it("stays hidden unless the sign_input flag is on", () => {
    const ws = renderView({ signInput: false });
    expect(screen.queryByRole("button", { name: "Sign" })).toBeNull();
    expect(sent(ws, "hello")[0].payload.caps.sign_input).toBe(false);
  });

  it("announces the capability and opens the tray", async () => {
    const ws = renderView();
    expect(sent(ws, "hello")[0].payload.caps.sign_input).toBe(true);
    const tray = await openTray();
    expect(within(tray).getByText("model picker")).toBeTruthy();
    expect(within(tray).queryByRole("button", { name: /Speak/ })).toBeNull(); // no draft yet
  });

  it("speaks a draft only on tap, with what was recognized and how long it took", async () => {
    const ws = renderView();
    const tray = await openTray();
    signSentence();
    expect(within(tray).getByText("Yes, a bag please.")).toBeTruthy();
    expect(within(tray).getByText(/yes bag/)).toBeTruthy(); // the signs, shown when they differ
    expect(sent(ws, "speak.confirm")).toHaveLength(0);

    fireEvent.click(within(tray).getByRole("button", { name: /Speak/ }));
    const [confirm] = sent(ws, "speak.confirm");
    expect(confirm.payload).toMatchObject({
      text: "Yes, a bag please.",
      modality: "sign",
      draft_text: "Yes, a bag please.",
      draft_id: "d1",
      model_version: "legacy:7",
      confidence: 0.8,
      timings: { recognize_ms: 200, english_ms: 700 },
    });
    expect(confirm.payload.timings.decide_ms).toBeGreaterThanOrEqual(0);
    expect(within(tray).queryByText("Yes, a bag please.")).toBeNull();
  });

  it("marks an unsure draft and can say the signs as they are", async () => {
    const ws = renderView();
    const tray = await openTray();
    signSentence("Yes, a bag please.", ["yes", "bag"], { confidence: 0.4 });
    expect(within(tray).getByText(/Not sure/)).toBeTruthy();
    fireEvent.click(within(tray).getByRole("button", { name: "Say my signs as they are" }));
    expect(sent(ws, "speak.confirm")[0].payload).toMatchObject({
      text: "yes bag",
      draft_text: "Yes, a bag please.",
      modality: "sign",
    });
  });

  it("reports Not this as a rejected sign draft", async () => {
    const ws = renderView();
    const tray = await openTray();
    signSentence();
    fireEvent.click(within(tray).getByRole("button", { name: "Not this" }));
    expect(sent(ws, "speak.reject")[0].payload).toMatchObject({
      draft_text: "Yes, a bag please.",
      modality: "sign",
      model_version: "legacy:7",
      confidence: 0.8,
    });
    expect(sent(ws, "speak.confirm")).toHaveLength(0);
  });

  it("moves a draft into the text box to edit, and counts it as an edited sign draft", async () => {
    const ws = renderView();
    const tray = await openTray();
    signSentence();
    fireEvent.click(within(tray).getByRole("button", { name: /Edit/ }));
    const box = screen.getByRole("textbox", { name: "Type what you want to say" });
    expect(box.value).toBe("Yes, a bag please.");
    expect(screen.getByText("From your signing")).toBeTruthy();
    fireEvent.change(box, { target: { value: "Yes, a small bag please." } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(sent(ws, "speak.confirm")[0].payload).toMatchObject({
      text: "Yes, a small bag please.",
      draft_text: "Yes, a bag please.",
      modality: "sign",
      model_version: "legacy:7",
    });
  });

  it("asks the conversation's language layer for English and keeps it out of the suggestions", async () => {
    const ws = renderView();
    await openTray();
    let english;
    act(() => {
      english = recognizer.props.toEnglish(["yes", "bag"]);
    });
    const [request] = sent(ws, "draft.request");
    expect(request.payload).toMatchObject({ kind: "gloss_to_english", gloss: ["yes", "bag"] });
    act(() =>
      ws.serverSend(
        env("draft.suggestions", {
          kind: "gloss_to_english",
          request_id: request.payload.request_id,
          draft_id: "d9",
          model_version: "llm@1",
          items: [{ text: "Yes, a bag please." }],
          available: true,
        })
      )
    );
    await expect(english).resolves.toEqual({ text: "Yes, a bag please.", draftId: "d9", modelVersion: "llm@1" });
    // A late answer to a request that already gave up is dropped, never shown as chips.
    act(() =>
      ws.serverSend(env("draft.suggestions", { kind: "gloss_to_english", request_id: "gone", items: [{ text: "Late" }] }))
    );
    expect(screen.queryByRole("group", { name: "Suggested replies" })).toBeNull();
  });

  it("uses the signs when the language layer is off", async () => {
    const ws = renderView();
    await openTray();
    let english;
    act(() => {
      english = recognizer.props.toEnglish(["yes"]);
    });
    const [request] = sent(ws, "draft.request");
    act(() =>
      ws.serverSend(env("draft.suggestions", { kind: "gloss_to_english", request_id: request.payload.request_id, items: [], available: false }))
    );
    await expect(english).resolves.toBeNull();
  });
});

describe("draftTimings", () => {
  it("only measures sign drafts and only sends what it knows", () => {
    expect(draftTimings(null)).toBeUndefined();
    expect(draftTimings({ modality: "llm_suggestion", shownAt: 0 })).toBeUndefined();
    expect(draftTimings({ modality: "sign", recognizeMs: 12.4, englishMs: null, shownAt: 1000 }, 2500)).toEqual({
      recognize_ms: 12,
      decide_ms: 1500,
    });
    expect(draftTimings({ modality: "sign" })).toBeUndefined();
  });
});
