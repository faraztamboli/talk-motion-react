import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  AUTH_EXPIRED_EVENT,
  REFRESH_TOKEN_KEY,
  apiFetch,
  getAccessToken,
  setTokens,
  wsUrl,
} from "./http";

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

describe("apiFetch", () => {
  beforeEach(() => {
    setTokens({ access_token: "old-access", refresh_token: "refresh-1" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the bearer token and parses JSON", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { hello: "world" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiFetch("/me")).resolves.toEqual({ hello: "world" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/me");
    expect(init.headers.Authorization).toBe("Bearer old-access");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "new-access", refresh_token: "refresh-2" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/me")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/auth/refresh");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refresh_token: "refresh-1" });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer new-access");
    expect(getAccessToken()).toBe("new-access");
  });

  it("ends the session when the refresh token is rejected", async () => {
    const expired = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, expired);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" }))
        .mockResolvedValueOnce(jsonResponse(401, { detail: "bad refresh" }))
    );

    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EXPIRED_EVENT, expired);
  });

  it("keeps the session on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 0, message: "network_error" });
    expect(getAccessToken()).toBe("old-access");
  });

  it("shares one refresh between concurrent 401s", async () => {
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        if (url.endsWith("/auth/refresh")) {
          refreshCalls += 1;
          return jsonResponse(200, { access_token: "new-access", refresh_token: "refresh-2" });
        }
        return init.headers.Authorization === "Bearer new-access"
          ? jsonResponse(200, { ok: true })
          : jsonResponse(401, { detail: "expired" });
      })
    );
    await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);
    expect(refreshCalls).toBe(1);
  });
});

describe("wsUrl", () => {
  it("derives a ws URL from the page origin and appends the token", () => {
    setTokens({ access_token: "tok en", refresh_token: "r" });
    expect(wsUrl("/ws/conversations/abc")).toBe(
      `${window.location.origin.replace(/^http/, "ws")}/ws/conversations/abc?token=tok%20en`
    );
  });
});
