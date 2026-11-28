import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The 3D stages need WebGL; the hint is what's under test here.
vi.mock("./AvatarStage", () => ({ default: () => null }));
vi.mock("./avatar/CharacterStage", () => ({ default: () => null }));

import AvatarPlayer from "./AvatarPlayer";

const idle = { frame: null, label: null, playing: false, stop: vi.fn(), enqueue: vi.fn(), sample: () => null };

describe("AvatarPlayer", () => {
  it("shows the idle hint at the bottom of the stage, not across the character", () => {
    render(<AvatarPlayer avatar={idle} placeholder="Signs for what you say play here." />);
    const hint = screen.getByText("Signs for what you say play here.");
    expect(hint).toHaveClass("tm-tr-stage-hint");
    expect(hint).not.toHaveClass("tm-tr-stage-placeholder");
  });

  it("hides the hint while signing", () => {
    render(<AvatarPlayer avatar={{ ...idle, playing: true, label: "hello" }} placeholder="Signs for what you say play here." />);
    expect(screen.queryByText("Signs for what you say play here.")).not.toBeInTheDocument();
  });
});
