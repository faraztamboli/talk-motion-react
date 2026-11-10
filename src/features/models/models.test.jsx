import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { canManage, canTrain, normalizeModel } from "./normalizeModel";

const query = vi.hoisted(() => ({ result: {} }));
vi.mock("./modelsApi", () => ({ useListModelsQuery: () => query.result }));
import ModelPicker from "./ModelPicker";

describe("normalizeModel", () => {
  it("maps legacy rows (badge, cents, recurring JSON, 0/1 booleans)", () => {
    const m = normalizeModel({
      id: 42,
      title: "ASL basics",
      is_public: 1,
      badge: "trainable",
      price: "500",
      recurring: '{"interval":"month"}',
      create_user: "ann",
    });
    expect(m).toMatchObject({
      id: "42",
      role: "trainer",
      isPublic: true,
      priceCents: 500,
      recurring: { interval: "month" },
      owner: "ann",
      trained: null,
    });
    expect(canTrain(m)).toBe(true);
    expect(canManage(m)).toBe(false);
  });

  it("keeps new listModels fields", () => {
    const m = normalizeModel({ id: "7", role: "owner", trained: true, concept_count: 12, sample_count: 240 });
    expect(m).toMatchObject({ role: "owner", trained: true, conceptCount: 12, sampleCount: 240 });
  });

  it("rejects rows without an id", () => {
    expect(normalizeModel({ title: "x" })).toBeNull();
    expect(normalizeModel(null)).toBeNull();
  });
});

describe("ModelPicker", () => {
  const renderPicker = (props) =>
    render(
      <MemoryRouter>
        <ModelPicker {...props} />
      </MemoryRouter>
    );

  it("links to the models page when there is nothing to choose", () => {
    query.result = { data: { rows: [], total: 0 }, isLoading: false, isFetching: false };
    renderPicker({ scope: "usable", onChange: vi.fn() });
    expect(screen.getByText(/don't have a model to translate with/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/models");
  });

  it("auto-selects the first trained model", () => {
    query.result = {
      data: {
        rows: [
          normalizeModel({ id: 1, title: "Draft", role: "owner", trained: false }),
          normalizeModel({ id: 2, title: "Ready", role: "owner", trained: true }),
        ],
      },
      isLoading: false,
      isFetching: false,
    };
    const onChange = vi.fn();
    renderPicker({ scope: "usable", onChange });
    expect(onChange).toHaveBeenCalledWith("2", expect.objectContaining({ title: "Ready" }));
  });

  it("keeps a valid selection", () => {
    query.result = {
      data: { rows: [normalizeModel({ id: 1, title: "A", role: "owner" }), normalizeModel({ id: 2, title: "B", role: "owner" })] },
      isLoading: false,
      isFetching: false,
    };
    const onChange = vi.fn();
    renderPicker({ scope: "trainable", value: "2", onChange });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a load error with a retry", () => {
    const refetch = vi.fn();
    query.result = { error: { code: "timeout" }, refetch, isLoading: false, isFetching: false };
    renderPicker({ scope: "usable", onChange: vi.fn() });
    screen.getByRole("button", { name: /try again/i }).click();
    expect(refetch).toHaveBeenCalled();
  });
});
