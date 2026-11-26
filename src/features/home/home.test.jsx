import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HOME_TASKS, visibleTasks } from "./tasks";
import { TaskCard, greeting } from "./HomePage";

describe("home tasks", () => {
  it("hides cards whose feature flag is off", () => {
    const keys = (flags) => visibleTasks(flags).map((t) => t.key);
    expect(keys({})).not.toContain("talk");
    expect(keys({})).not.toContain("models");
    expect(keys({ conversation_v2: true, legacy_models_visible: true })).toEqual(
      HOME_TASKS.map((t) => t.key)
    );
  });

  it("uses plain words: no card label is a feature name or jargon", () => {
    for (const task of HOME_TASKS) {
      expect(task.label).not.toMatch(/LSTM|tree|manager|designer|converter/i);
      expect(task.hint.length).toBeGreaterThan(20);
    }
  });
});

describe("TaskCard", () => {
  it("is a real button that opens its page", () => {
    const onOpen = vi.fn();
    render(<TaskCard task={HOME_TASKS[1]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /Translate signs and speech/ }));
    expect(onOpen).toHaveBeenCalledWith("/converter");
  });
});

describe("greeting", () => {
  it("follows the time of day", () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 0, 1, 20))).toBe("Good evening");
  });
});
