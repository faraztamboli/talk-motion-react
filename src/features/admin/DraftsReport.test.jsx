import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("../../api/http", () => ({ apiFetch }));

import DraftsReport from "./DraftsReport";

const latency = (p50, p90) => ({ p50, p90 });

describe("DraftsReport", () => {
  it("shows acceptance and latency per input and model", async () => {
    apiFetch.mockResolvedValueOnce({
      days: 30,
      groups: [
        {
          modality: "sign",
          model_version: "legacy:121",
          total: 4,
          accepted: 2,
          edited: 1,
          rejected: 1,
          expired: 0,
          acceptance_rate: 0.5,
          latency_ms: {
            recognize_ms: latency(240, 600),
            english_ms: latency(1200, 2500),
            decide_ms: latency(null, null),
            tts_ms: latency(310, 480),
          },
        },
      ],
    });
    render(<DraftsReport days={30} />);
    expect(await screen.findByText("Signing")).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledWith("/admin/drafts?days=30");
    expect(screen.getByText("legacy:121")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy(); // spoken as is
    expect(screen.getAllByText("25%")).toHaveLength(2); // edited, turned down
    expect(screen.getByText("240 ms")).toBeTruthy();
    expect(screen.getByText("1.2 s")).toBeTruthy();
  });

  it("says when it is for platform admins only", async () => {
    apiFetch.mockRejectedValueOnce(Object.assign(new Error("Forbidden"), { status: 403 }));
    render(<DraftsReport days={7} />);
    expect(await screen.findByText("Platform admins only.")).toBeTruthy();
  });
});
