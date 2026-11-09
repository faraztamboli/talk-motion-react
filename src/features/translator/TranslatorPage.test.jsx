import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import conversationReducer, { addConversationEntry } from "../../app/features/conversationSlice";

vi.mock("../../api/rpc", () => ({
  rpc: vi.fn(async () => null),
  hasRpc: () => false,
  sessionToken: () => "tok",
  rpcErrorMessage: (err, fallback) => fallback,
}));
vi.mock("../../hooks/useFlag", () => ({ useFlag: () => true }));
vi.mock("../models/ModelPicker", () => ({
  default: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange("5")}>
      {value ? `model ${value}` : "pick a model"}
    </button>
  ),
}));
vi.mock("./useBrowserModel", () => ({ default: () => ({ status: "server", ready: false, predict: vi.fn() }) }));

import TranslatorPage from "./TranslatorPage";

function renderPage() {
  const store = configureStore({
    reducer: { conversation: conversationReducer, apiAuth: () => ({ status: "unavailable" }) },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <TranslatorPage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

class FakeRecognition {
  start() {}
  abort() {}
}

describe("TranslatorPage", () => {
  beforeEach(() => {
    window.webkitSpeechRecognition = FakeRecognition;
  });
  afterEach(() => {
    delete window.webkitSpeechRecognition;
    localStorage.clear();
  });

  it("shows both directions and the conversation", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Translator" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign to speech" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Speech to sign" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByText(/Start signing or speaking/)).toBeInTheDocument();
  });

  it("asks for a model before the camera or microphone can start", () => {
    renderPage();
    expect(screen.getAllByText("Choose a model above first.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /start camera/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "pick a model" }));
    expect(screen.getByRole("button", { name: /start camera/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeEnabled();
    expect(localStorage.getItem("tm_translator_model")).toBe("5");
  });

  it("remembers the model and keeps the speak-only-when-asked switch", () => {
    localStorage.setItem("tm_translator_model", "9");
    renderPage();
    expect(screen.getByRole("button", { name: "model 9" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Speak automatically" })).not.toBeChecked();
  });

  it("lists a sentence said twice twice", () => {
    const store = renderPage();
    store.dispatch(addConversationEntry({ source: "voice", text: "hello" }));
    store.dispatch(addConversationEntry({ source: "voice", text: "hello" }));
    expect(store.getState().conversation.entries).toHaveLength(2);
  });

  it("says when the browser can't listen", () => {
    delete window.webkitSpeechRecognition;
    renderPage();
    expect(screen.getByText(/This browser can't listen/)).toBeInTheDocument();
  });

  it("send, undo and clear start disabled with an empty sentence", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
    // (i18next interpolates {{seconds}} in the app; tests run without an i18n instance)
    expect(screen.getByText(/Lower your hands for .* to send/)).toBeInTheDocument();
  });
});
