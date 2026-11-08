/** Captioned lessons: the teacher's start button, the teacher view and the student view. */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import reducer from "./state/conversationV2Slice";
import ConversationView from "./components/ConversationView";
import StartLessonButton from "./components/StartLessonButton";
import { createLesson } from "./api";
import { FakeWebSocket, installFakeWebSocket } from "../../test/fakeWebSocket";
import { flagsState, renderWithProviders } from "../../test/renderWithProviders";

vi.mock("./hooks/useMicStream", () => ({
  default: () => ({ supported: true, active: false, level: 0, error: null }),
  micStreamSupported: () => false,
}));
vi.mock("./hooks/useBrowserASR", () => ({
  default: () => ({ supported: true, listening: false, error: null }),
  browserASRSupported: () => true,
}));
vi.mock("./hooks/useTTSPlayer", () => ({
  default: () => ({ begin() {}, end() {}, speakText() {}, chunk() {}, unlock() {} }),
}));
vi.mock("./api", () => ({
  listUtterances: () => Promise.resolve({ items: [] }),
  endConversation: () => Promise.resolve(),
  fetchTranscript: () => Promise.resolve({ cues: [] }),
  shareConversation: () => Promise.resolve({ join_code: "NEWCODE" }),
  getConversation: () => Promise.resolve({ join_code: "ABCD23" }),
  createLesson: vi.fn(() => Promise.resolve({ id: "conv-9", join_code: "KLMN45", join_code_expires_at: null })),
  transcriptToText: () => "",
}));

const env = (type, payload) => ({ id: "x", type, conversation_id: "c1", payload });

function helloAck(isOwner) {
  return env("hello.ack", {
    participant_id: isOwner ? "teacher" : "kid",
    role: isOwner ? "partner" : "primary",
    display_name: isOwner ? "Ms Lee" : "Kai",
    is_owner: isOwner,
    conversation: { settings: { kind: "lesson", plain_language: true }, spoken_language: "en" },
    asr_provider: "browser",
    asr_server_side: false,
    tts_provider: "browser",
    llm_available: true,
    participants: [],
  });
}

function renderView(isOwner, props = {}) {
  const store = configureStore({ reducer: { conversationV2: reducer } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ConversationView conversationId="c1" getToken={() => "tok"} guest={!isOwner} {...props} />
      </MemoryRouter>
    </Provider>
  );
  const ws = FakeWebSocket.instances[0];
  act(() => ws.serverOpen());
  act(() => ws.serverSend(helloAck(isOwner)));
  return ws;
}

describe("lesson views", () => {
  let restore;
  beforeEach(() => {
    restore = installFakeWebSocket();
  });
  afterEach(() => restore());

  it("shows the teacher a large code, the link, the mic toggle and no compose tray", () => {
    renderView(true, { initialShare: { joinCode: "ABCD23" } });
    expect(screen.getByTestId("lesson-code")).toHaveTextContent("ABCD23");
    expect(screen.getByRole("link", { name: "https://app.talk-motion.com/c/ABCD23" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /listen to speech/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /end lesson/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("gives students read-only captions with text size and plain language controls", () => {
    const ws = renderView(false);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lesson-code")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /listen to speech/i })).not.toBeInTheDocument();
    expect(document.querySelector("[data-text-size]").dataset.textSize).toBe("l");

    act(() =>
      ws.serverSend(
        env("utterance.final", {
          id: 1,
          participant_id: "teacher",
          text: "Open your books.",
          plain_text: "Open books.",
          source: "speech",
        })
      )
    );
    expect(screen.getByText("Open your books.")).toBeInTheDocument();
    expect(screen.getByText("Open books.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: /plain language/i }));
    expect(screen.queryByText("Open books.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("A+++"));
    expect(document.querySelector("[data-text-size]").dataset.textSize).toBe("xl");
  });
});

describe("StartLessonButton", () => {
  const authed = { status: "authenticated", user: { id: "u1" }, error: null };

  it("is hidden without conversation_v2 or an API session", () => {
    renderWithProviders(<StartLessonButton classroomName="Maths" />, {
      preloadedState: { flags: flagsState({ conversation_v2: false }), apiAuth: authed },
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is hidden without an API session", () => {
    renderWithProviders(<StartLessonButton classroomName="Maths" />, {
      preloadedState: { flags: flagsState({ conversation_v2: true }) },
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("creates a lesson and opens the teacher view", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<StartLessonButton classroomName="Maths" />} />
        <Route path="/conversation/:id" element={<p>teacher view</p>} />
      </Routes>,
      { preloadedState: { flags: flagsState({ conversation_v2: true }), apiAuth: authed } }
    );
    fireEvent.click(screen.getByRole("button", { name: /start captioned lesson/i }));
    await waitFor(() => expect(screen.getByText("teacher view")).toBeInTheDocument());
    expect(createLesson).toHaveBeenCalledWith("Maths");
  });
});
