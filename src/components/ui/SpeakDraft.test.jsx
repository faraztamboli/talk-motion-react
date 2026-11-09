/**
 * The legacy Translator keeps TalkMotion's promise: a recognized sign is spoken only after
 * the signer taps Speak, unless they turn on "Speak automatically" themselves.
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import useConfirmToSpeak, { AUTO_SPEAK_KEY } from "../../hooks/useConfirmToSpeak";
import SpeakDraft from "./SpeakDraft";

function Harness({ speak }) {
  const s = useConfirmToSpeak(speak);
  return (
    <>
      <button type="button" onClick={() => s.offer("HELLO", 0.5)}>
        recognize
      </button>
      <SpeakDraft {...s} volume={0.7} />
    </>
  );
}

describe("confirm to speak in the Translator", () => {
  afterEach(() => localStorage.clear());

  it("waits for a tap", () => {
    const speak = vi.fn();
    render(<Harness speak={speak} />);
    fireEvent.click(screen.getByText("recognize"));
    expect(speak).not.toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Recognized sign, not spoken yet" }).textContent).toMatch(/HELLO/);
    fireEvent.click(screen.getByRole("button", { name: /Speak/ }));
    expect(speak).toHaveBeenCalledWith("HELLO", 0.7);
    expect(screen.queryByRole("region", { name: "Recognized sign, not spoken yet" })).toBeNull();
  });

  it("can be dismissed without speaking", () => {
    const speak = vi.fn();
    render(<Harness speak={speak} />);
    fireEvent.click(screen.getByText("recognize"));
    fireEvent.click(screen.getByRole("button", { name: "Not this" }));
    expect(speak).not.toHaveBeenCalled();
  });

  it("speaks right away only after the signer turns it on, and remembers the choice", () => {
    const speak = vi.fn();
    render(<Harness speak={speak} />);
    fireEvent.click(screen.getByRole("switch", { name: "Speak automatically" }));
    fireEvent.click(screen.getByText("recognize"));
    expect(speak).toHaveBeenCalledWith("HELLO", 0.5);
    expect(localStorage.getItem(AUTO_SPEAK_KEY)).toBe("1");
  });

  it("is off by default", () => {
    const { result } = renderHook(() => useConfirmToSpeak(vi.fn()));
    expect(result.current.autoSpeak).toBe(false);
    act(() => result.current.offer("THANK-YOU", 1));
    expect(result.current.draft).toBe("THANK-YOU");
  });
});
