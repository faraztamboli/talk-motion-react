import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import InterpreterNotice, {
  INTERPRETER_NOTICE_KEY,
  INTERPRETER_REQUEST_TEXT,
} from "./components/InterpreterNotice";
import ComposeTray from "./components/ComposeTray";

describe("InterpreterNotice", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("tells both people that TalkMotion does not replace an interpreter", () => {
    render(<InterpreterNotice onAsk={vi.fn()} />);
    expect(screen.getByText(/does not replace one/i)).toBeTruthy();
  });

  it("calls onAsk from the button", () => {
    const onAsk = vi.fn();
    render(<InterpreterNotice onAsk={onAsk} />);
    fireEvent.click(screen.getByRole("button", { name: /ask for an interpreter/i }));
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it("stays hidden on this device once dismissed", () => {
    const { unmount } = render(<InterpreterNotice onAsk={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(localStorage.getItem(INTERPRETER_NOTICE_KEY)).toBe("1");
    unmount();
    render(<InterpreterNotice onAsk={vi.fn()} />);
    expect(screen.queryByText(/does not replace one/i)).toBeNull();
  });
});

describe("ComposeTray prefill", () => {
  it("fills the box but never speaks on its own", () => {
    const onSpeak = vi.fn();
    const { rerender } = render(
      <ComposeTray onSpeak={onSpeak} onReject={vi.fn()} onTyping={vi.fn()} suggestions={null} prefill={null} />
    );
    rerender(
      <ComposeTray
        onSpeak={onSpeak}
        onReject={vi.fn()}
        onTyping={vi.fn()}
        suggestions={null}
        prefill={{ text: INTERPRETER_REQUEST_TEXT, nonce: 1 }}
      />
    );
    expect(screen.getByRole("textbox").value).toBe(INTERPRETER_REQUEST_TEXT);
    expect(onSpeak).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /speak/i }));
    expect(onSpeak).toHaveBeenCalledWith({ text: INTERPRETER_REQUEST_TEXT, draft: null });
  });
});
