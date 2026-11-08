import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

vi.mock("../../api/http", async (orig) => ({ ...(await orig()), apiFetch: vi.fn() }));
import { apiFetch } from "../../api/http";
import { clearPlainLanguageCache } from "../../hooks/usePlainLanguage";
import { PlainLanguage } from "./PlainLanguage";

const signedIn = { apiAuth: { status: "authenticated", user: { id: "u1" }, error: null } };
const TEXT = "please proceed to the registration desk";

describe("PlainLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
    apiFetch.mockReset();
    clearPlainLanguageCache();
  });

  it("renders nothing without an API session", () => {
    renderWithProviders(<PlainLanguage text={TEXT} />);
    expect(screen.queryByTestId("plain-language")).toBeNull();
  });

  it("toggles, persists, and shows the simplified sentence", async () => {
    apiFetch.mockResolvedValue({ plain_text: "Go to the desk." });
    renderWithProviders(<PlainLanguage text={TEXT} />, { preloadedState: signedIn });
    expect(apiFetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("switch"));
    expect(localStorage.getItem("tm_plain_language")).toBe("1");
    expect(await screen.findByText("Go to the desk.", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("shows a small hint on failure", async () => {
    localStorage.setItem("tm_plain_language", "1");
    apiFetch.mockRejectedValue(new Error("down"));
    renderWithProviders(<PlainLanguage text={TEXT} />, { preloadedState: signedIn });
    await waitFor(() => expect(screen.getByText(/unavailable right now/)).toBeInTheDocument(), { timeout: 3000 });
  });
});
