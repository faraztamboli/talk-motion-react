import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CharacterPicker from "./CharacterPicker";
import { findCharacter, resolveLook } from "./characters";

describe("CharacterPicker", () => {
  it("shows the character, the look button and the licence credit", () => {
    const mika = findCharacter("mika");
    render(<CharacterPicker character={mika} look={resolveLook(mika)} onCharacter={vi.fn()} onPart={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole("button", { name: /look/i })).toBeInTheDocument();
    expect(screen.getByText(/pixiv Inc\./)).toBeInTheDocument();
  });

  it("names Seed-san's owner (credit is required by its licence)", () => {
    const seed = findCharacter("seed");
    render(<CharacterPicker character={seed} look={resolveLook(seed)} onCharacter={vi.fn()} onPart={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText(/VirtualCast, Inc\./)).toBeInTheDocument();
  });

  it("offers no colours for the skeleton", () => {
    const wf = findCharacter("wireframe");
    render(<CharacterPicker character={wf} look={{}} onCharacter={vi.fn()} onPart={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /look/i })).toBeNull();
  });

  it("changes a colour part from the swatches", () => {
    const mika = findCharacter("mika");
    const onPart = vi.fn();
    render(<CharacterPicker character={mika} look={resolveLook(mika)} onCharacter={vi.fn()} onPart={onPart} onReset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /look/i }));
    fireEvent.click(screen.getByRole("radio", { name: "Skin: Deep" }));
    expect(onPart).toHaveBeenCalledWith("skin", "deep");
  });
});
