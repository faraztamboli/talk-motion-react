import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { HANDS_DOWN_STOP_MS, MIN_FRAMES, NO_HANDS_GIVE_UP_MS, reviewTake, stopReason, trimTake } from "./collect/captureLogic";
import useCaptureSession from "./collect/useCaptureSession";
import { parseProgress, progressPercent } from "./train/trainingProgress";
import { normalizeReplayFrames } from "./SampleReplay";
import { splitConceptInput } from "./ConceptsTab";
import { normalizeConcept } from "./modelsApi";

const hand = { leftHandLandmarks: [{ x: 0.1, y: 0.2, z: 0 }] };
const frame = (t, withHand = true) => ({ t, data: withHand ? hand : {} });

describe("captureLogic", () => {
  it("trims hand-less frames at both ends but keeps gaps in the middle", () => {
    const frames = [frame(0, false), frame(33), frame(66, false), frame(99), frame(132, false)];
    expect(trimTake(frames).map((f) => f.t)).toEqual([33, 66, 99]);
    expect(trimTake([frame(0, false)])).toEqual([]);
  });

  it("stops on time, on hands down after signing, and gives up without hands", () => {
    expect(stopReason([frame(0)], 0, 2000, 2000)).toBe("time");
    expect(stopReason([frame(0, false)], 0, 2000, 2000)).toBe("no-hands");
    expect(stopReason([frame(0, false)], 0, NO_HANDS_GIVE_UP_MS, 10000)).toBe("no-hands");
    expect(stopReason([frame(0, false)], 0, 1000, 10000)).toBeNull();
    const signed = Array.from({ length: MIN_FRAMES }, (_, i) => frame(i * 33));
    const last = signed[signed.length - 1].t;
    expect(stopReason(signed, 0, last + HANDS_DOWN_STOP_MS, 10000)).toBe("hands-down");
    expect(stopReason(signed, 0, last + 100, 10000)).toBeNull();
    // a brief glimpse of a hand doesn't end the take
    expect(stopReason([frame(0), frame(33, false)], 0, 1000, 10000)).toBeNull();
  });

  it("blocks takes that are too short and tips when hands go missing", () => {
    expect(reviewTake([frame(0)]).problems).toHaveLength(1);
    const patchy = Array.from({ length: 20 }, (_, i) => frame(i * 33, i % 2 === 0 && i < 10));
    const r = reviewTake(patchy);
    expect(r.problems).toEqual([]);
    expect(r.tips).toHaveLength(1);
    expect(r.duration).toBe(19 * 33);
  });
});

describe("parseProgress", () => {
  it("follows the stages and reads accuracy", () => {
    const lines = [
      "Training started on worker x",
      "architecture lstm",
      "Epoch 1 of up to 400: accuracy 20%, validation 15%",
      "Epoch 12 of up to 400: accuracy 83%, validation 79%",
    ].map((message, i) => ({ seq: i + 1, message }));
    const p = parseProgress(lines, "running");
    expect(p).toMatchObject({ stage: "learning", epoch: 12, maxEpochs: 400, accuracy: 0.83, validation: 0.79 });
    expect(progressPercent(p, "running")).toBeGreaterThan(10);
    expect(progressPercent(p, "running")).toBeLessThan(85);

    const done = parseProgress(
      [...lines, { seq: 9, message: "Finished learning; saving the model" }, { seq: 10, message: "Exported browser (TF.js) model" },
        { seq: 11, message: "Validation accuracy 81.25%" }, { seq: 12, message: "Test accuracy 78.00%" }, { seq: 13, message: "Training Complete!" }],
      "complete"
    );
    expect(done).toMatchObject({ stage: "done", finalValidation: 0.8125, finalTest: 0.78, browserExport: true });
    expect(progressPercent(done, "complete")).toBe(100);
  });

  it("captures the failure reason", () => {
    const p = parseProgress([{ seq: 1, message: "Training failed: not enough samples" }], "failed");
    expect(p.failure).toBe("not enough samples");
  });

  it("queued jobs start near zero", () => {
    expect(progressPercent(parseProgress([], "queued"), "queued")).toBe(2);
  });
});

describe("useCaptureSession", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function run(save = vi.fn(async () => ({ sampleCount: 5, captureId: "c1" })), undo = vi.fn(async () => {})) {
    const hook = renderHook(() => useCaptureSession({ save, undo, maxSeconds: 2, countdownSeconds: 3 }));
    return { ...hook, save, undo };
  }

  function recordSign(result, signFrames = 20) {
    act(() => result.current.start());
    expect(result.current.phase).toBe("countdown");
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.phase).toBe("recording");
    const t0 = Date.now();
    act(() => {
      for (let i = 0; i < signFrames; i++) result.current.onFrame(hand, { timestamp: t0 + i * 33 });
      // hands drop: the take ends on its own
      result.current.onFrame({}, { timestamp: t0 + signFrames * 33 + HANDS_DOWN_STOP_MS + 50 });
    });
  }

  it("counts down, records, stops when the hands drop, and keeps the take", async () => {
    const { result, save } = run();
    recordSign(result);
    expect(result.current.phase).toBe("review");
    expect(result.current.take.frames).toHaveLength(20);
    await act(async () => {
      await result.current.keep();
    });
    expect(save).toHaveBeenCalledWith(expect.any(Array));
    expect(result.current.phase).toBe("idle");
    expect(result.current.kept).toHaveLength(1);
    expect(result.current.lastCount).toBe(5);
  });

  it("undoes a kept take", async () => {
    const { result, undo } = run();
    recordSign(result);
    await act(async () => {
      await result.current.keep();
    });
    await act(async () => {
      await result.current.undoTake(result.current.kept[0].id);
    });
    expect(undo).toHaveBeenCalledWith("c1");
    expect(result.current.kept[0].undone).toBe(true);
    expect(result.current.lastCount).toBe(4);
  });

  it("stays in review with a message when saving fails", async () => {
    const save = vi.fn(async () => {
      throw Object.assign(new Error("x"), { userMessage: "Server says no" });
    });
    const { result } = run(save);
    recordSign(result);
    await act(async () => {
      await result.current.keep();
    });
    expect(result.current.phase).toBe("review");
    expect(result.current.notice.text).toBe("Server says no");
  });

  it("gives up with a hint when no hands appear", () => {
    const { result } = run();
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    act(() => vi.advanceTimersByTime(NO_HANDS_GIVE_UP_MS + 200));
    expect(result.current.phase).toBe("idle");
    expect(result.current.notice.text).toMatch(/didn't see your hands/);
  });

  it("ends a take at its length even if frames stop arriving", () => {
    const { result } = run();
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    act(() => result.current.onFrame(hand, { timestamp: Date.now() }));
    act(() => vi.advanceTimersByTime(2100));
    expect(result.current.phase).toBe("review");
  });

  it("cancel during countdown returns to idle", () => {
    const { result } = run();
    act(() => result.current.start());
    act(() => result.current.cancel());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.phase).toBe("idle");
  });
});

describe("helpers", () => {
  it("splits concept input on commas and new lines, without duplicates", () => {
    expect(splitConceptInput(" hello, Thank  you\nplease;hello ,, ")).toEqual(["hello", "Thank you", "please"]);
  });

  it("normalizes server concepts", () => {
    expect(normalizeConcept({ concept: "thank you", sample_count: 7, indexed_count: 5, pending_count: 2, target_samples: 20, video_url: null })).toEqual({
      concept: "thank you",
      label: "thank you",
      kind: "phrase",
      sampleCount: 7,
      readyCount: 5,
      processingCount: 2,
      target: 20,
      videoUrl: null,
      declared: false,
    });
  });

  it("normalizes replay frames from a live take and from a stored sample", () => {
    const live = normalizeReplayFrames([{ t: 1000, data: { rightHandLandmarks: [{ x: 1, y: 2, z: 3 }] } }, { t: 1033, data: {} }]);
    expect(live[0]).toEqual({ t: 0, left: null, right: [{ x: 1, y: 2, z: 3 }], pose: null });
    expect(live[1].t).toBe(33);
    const stored = normalizeReplayFrames([{ t: 0, lh: [[0.1, 0.2, 0.3]], rh: null, pose: null }]);
    expect(stored[0].left).toEqual([{ x: 0.1, y: 0.2, z: 0.3 }]);
  });
});

// ------------------------------------------------------------------ pages (data hooks mocked)

const api = vi.hoisted(() => ({
  list: { data: { rows: [], total: 0 }, isLoading: false, isFetching: false },
  details: { data: null, isLoading: false },
  readiness: { data: null, isLoading: false, refetch: () => {} },
  jobs: { data: [], isLoading: false },
  concepts: { data: [], isLoading: false },
  job: { job: null, messages: [], error: null },
  mutation: () => [() => ({ unwrap: async () => ({}) }), { isLoading: false }],
}));

vi.mock("./modelsApi", async (orig) => {
  const real = await orig();
  return {
    ...real,
    useListModelsQuery: () => api.list,
    useGetModelDetailsQuery: () => api.details,
    useGetTrainingReadinessQuery: () => api.readiness,
    useListTrainingJobsQuery: () => api.jobs,
    useListConceptsQuery: () => api.concepts,
    useCreateModelMutation: api.mutation,
    useStartTrainingMutation: api.mutation,
    useCancelTrainingMutation: api.mutation,
  };
});
vi.mock("./train/useTrainingJob", () => ({ default: () => api.job }));

import ModelsPage from "./ModelsPage";
import ModelPage from "./ModelPage";
import TrainTab from "./TrainTab";
import { normalizeModel } from "./normalizeModel";

const model = (over = {}) => ({
  ...normalizeModel({ id: 7, title: "Greetings", role: "owner", trained: false, concept_count: 3, sample_count: 40 }),
  permissions: { use: true, train: true, manage: true },
  labels: [],
  ...over,
});

describe("ModelsPage", () => {
  it("explains the steps when there are no models", () => {
    api.list = { data: { rows: [], total: 0 }, isLoading: false, isFetching: false };
    render(
      <MemoryRouter>
        <ModelsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/don't have a model yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create your first model/i })).toBeInTheDocument();
  });

  it("lists models with status and links to each", () => {
    api.list = {
      data: { rows: [normalizeModel({ id: 7, title: "Greetings", role: "trainer", trained: true, concept_count: 3, sample_count: 40, trainers: [] })], total: 1 },
      isLoading: false,
      isFetching: false,
    };
    render(
      <MemoryRouter>
        <ModelsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Greetings" })).toHaveAttribute("href", "/models/7");
    expect(screen.getByText("Ready to translate")).toBeInTheDocument();
    expect(screen.getByText("Trainer")).toBeInTheDocument();
  });
});

describe("ModelPage", () => {
  const renderAt = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/models/:modelId" element={<ModelPage />}>
            <Route index element={<p>overview</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  it("shows only the tabs a purchaser may use", () => {
    api.details = { data: model({ role: "purchaser", trained: true, permissions: { use: true, train: false, manage: false } }), isLoading: false };
    renderAt("/models/7");
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Overview", "Words & phrases", "Trainers"]);
    expect(screen.getByRole("link", { name: /try it in the translator/i })).toHaveAttribute("href", "/converter?model=7");
  });

  it("gives the owner every tab", () => {
    api.details = { data: model(), isLoading: false };
    renderAt("/models/7");
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });

  it("says when a model doesn't exist", () => {
    api.details = { data: null, error: { code: "server_error", message: "Model not found" }, isLoading: false };
    renderAt("/models/99");
    expect(screen.getByText(/can't find that model/i)).toBeInTheDocument();
  });
});

describe("TrainTab", () => {
  const renderTab = () =>
    render(
      <MemoryRouter initialEntries={["/models/7/train"]}>
        <Routes>
          <Route path="/models/:modelId" element={<OutletWith />}>
            <Route path="train" element={<TrainTab />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  function OutletWith() {
    return <Outlet context={{ model: model(), modelId: "7" }} />;
  }

  it("explains why it can't train yet", () => {
    api.readiness = {
      data: { ready: false, problems: [{ code: "too_few_samples", message: "Each word or phrase needs at least 5 samples.", concepts: ["bye"] }], warnings: [], trainable_concepts: 2, total_samples: 7, pending_samples: 0 },
      isLoading: false,
      refetch: () => {},
    };
    api.jobs = { data: [], isLoading: false };
    api.job = { job: null, messages: [], error: null };
    renderTab();
    expect(screen.getByText(/needs at least 5 samples/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start training/i })).toBeDisabled();
  });

  it("shows a finished job's accuracy and the next step", () => {
    api.readiness = { data: { ready: true, problems: [], warnings: [], trainable_concepts: 3, total_samples: 60, pending_samples: 0 }, isLoading: false, refetch: () => {} };
    api.jobs = { data: [{ id: 4, status: "complete", requested_by: "ann", create_time: "2026-11-09 10:00:00" }], isLoading: false };
    api.job = {
      job: { job_id: 4, status: "complete", metrics: { val_metrics: 0.9, test_metrics: 0.85 } },
      messages: [{ seq: 1, message: "Training Complete!" }],
      error: null,
    };
    renderTab();
    expect(screen.getByText("Training finished")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("explains a failure in plain words", () => {
    api.jobs = { data: [{ id: 5, status: "failed", requested_by: "ann" }], isLoading: false };
    api.job = { job: { job_id: 5, status: "failed", error_message: "Traceback ... ResourceExhaustedError" }, messages: [], error: null };
    renderTab();
    expect(screen.getByText(/ran out of memory/)).toBeInTheDocument();
    expect(screen.queryByText(/Traceback/)).not.toBeInTheDocument();
  });
});
