import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "../test/renderWithProviders";

vi.mock("../api/http", async (orig) => ({ ...(await orig()), apiFetch: vi.fn() }));
import { apiFetch } from "../api/http";
import { DEBOUNCE_MS, clearPlainLanguageCache, usePlainLanguage } from "./usePlainLanguage";

const signedIn = { status: "authenticated", user: { id: "u1" }, error: null };
const wrapper = (apiAuth) => {
  const store = makeStore(apiAuth ? { apiAuth } : {});
  const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  return Wrapper;
};
const TEXT = "please proceed to the registration desk";

describe("usePlainLanguage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ plain_text: "Go to the desk." });
    clearPlainLanguageCache();
  });
  afterEach(() => vi.useRealTimers());

  it("debounces, then fetches once", async () => {
    const { result, rerender } = renderHook(({ t }) => usePlainLanguage(t, true), {
      wrapper: wrapper(signedIn),
      initialProps: { t: "please proceed to the" },
    });
    rerender({ t: TEXT });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS - 10); });
    expect(apiFetch).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(20); });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][1].body.text).toBe(TEXT);
    expect(result.current.plain).toBe("Go to the desk.");
  });

  it("caches by text", async () => {
    const first = renderHook(() => usePlainLanguage(TEXT, true), { wrapper: wrapper(signedIn) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS + 10); });
    first.unmount();
    const second = renderHook(() => usePlainLanguage(TEXT, true), { wrapper: wrapper(signedIn) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS + 10); });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(second.result.current.plain).toBe("Go to the desk.");
  });

  it("skips text under 4 words", async () => {
    renderHook(() => usePlainLanguage("hello there friend", true), { wrapper: wrapper(signedIn) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS * 2); });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("does nothing without an API session", async () => {
    const { result } = renderHook(() => usePlainLanguage(TEXT, true), { wrapper: wrapper(null) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS * 2); });
    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.available).toBe(false);
  });

  it("does nothing when disabled", async () => {
    renderHook(() => usePlainLanguage(TEXT, false), { wrapper: wrapper(signedIn) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS * 2); });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("reports errors without throwing", async () => {
    apiFetch.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => usePlainLanguage(TEXT, true), { wrapper: wrapper(signedIn) });
    await act(async () => { vi.advanceTimersByTime(DEBOUNCE_MS + 10); });
    expect(result.current.error).toBe(true);
    expect(result.current.plain).toBe("");
  });
});
