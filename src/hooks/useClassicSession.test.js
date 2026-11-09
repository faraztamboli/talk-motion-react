import { afterEach, describe, expect, it, vi } from "vitest";
import JS2Py from "../remotepyjs";
import { checkStoredSession, freshAccessToken, signInWithApiToken } from "./useClassicSession";
import { safeReturnPath } from "./useLogin";

function jwt(payload) {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.sig`;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("checkStoredSession", () => {
  it("returns null without a token", async () => {
    const call = vi.fn();
    await expect(checkStoredSession(call, null)).resolves.toBeNull();
    expect(call).not.toHaveBeenCalled();
  });

  it("starts the session and resolves the isLoggedIn reply when signed in", async () => {
    const call = vi.fn(async (name) =>
      name === "SessionServer.isLoggedIn" ? { isLoggedIn: true, user: { username: "ann" } } : null
    );
    await expect(checkStoredSession(call, "tok")).resolves.toMatchObject({ user: { username: "ann" } });
    expect(call).toHaveBeenCalledWith("SessionServer.startSessionIfNotStarted", ["tok"], { raw: true });
  });

  it("returns null when the server says signed out", async () => {
    const call = vi.fn(async () => ({ isLoggedIn: false }));
    await expect(checkStoredSession(call, "tok")).resolves.toBeNull();
  });
});

describe("signInWithApiToken", () => {
  it("skips accounts without a legacy username", async () => {
    const call = vi.fn();
    await expect(signInWithApiToken({ call, accessToken: jwt({ sub: "x" }) })).resolves.toBeNull();
    expect(call).not.toHaveBeenCalled();
  });

  it("skips servers without loginWithApiToken", async () => {
    vi.spyOn(JS2Py, "has").mockReturnValue(false);
    const call = vi.fn();
    await expect(signInWithApiToken({ call, accessToken: jwt({ lu: "ann" }) })).resolves.toBeNull();
    expect(call).not.toHaveBeenCalled();
  });

  it("signs a new session in and stores it", async () => {
    vi.spyOn(JS2Py, "has").mockReturnValue(true);
    const call = vi.fn(async (name) => {
      if (name === "SessionServer.getNewSessionId") return "sid-1";
      if (name === "TalkMotionServer.loginWithApiToken") return { isValidUser: true, isPasswordCorrect: true };
      if (name === "SessionServer.isLoggedIn") return { isLoggedIn: true, user: { username: "ann", first: "Ann" } };
      return null;
    });
    const result = await signInWithApiToken({ call, accessToken: jwt({ lu: "ann" }) });
    expect(result.sessionId).toBe("sid-1");
    expect(localStorage.getItem("token")).toBe("sid-1");
  });

  it("stores nothing when the server refuses the token", async () => {
    vi.spyOn(JS2Py, "has").mockReturnValue(true);
    const call = vi.fn(async (name) =>
      name === "SessionServer.getNewSessionId" ? "sid-2" : { isValidUser: false, isPasswordCorrect: false }
    );
    await expect(signInWithApiToken({ call, accessToken: jwt({ lu: "ann" }) })).resolves.toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("freshAccessToken", () => {
  it("keeps a token with time left", async () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 });
    const refresh = vi.fn();
    await expect(freshAccessToken({ getToken: () => token, refresh })).resolves.toBe(token);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes a token about to expire, and gives up quietly if refresh fails", async () => {
    const old = jwt({ exp: Math.floor(Date.now() / 1000) + 10 });
    await expect(freshAccessToken({ getToken: () => old, refresh: async () => "new" })).resolves.toBe("new");
    await expect(
      freshAccessToken({ getToken: () => old, refresh: async () => Promise.reject(new Error("x")) })
    ).resolves.toBeNull();
  });
});

describe("safeReturnPath", () => {
  it.each([
    ["/models/42/concepts", "/models/42/concepts"],
    ["/video-subtitles/designer?x=1", "/video-subtitles/designer?x=1"],
    ["//evil.example/x", null],
    ["https://evil.example", null],
    ["/login", null],
    [undefined, null],
  ])("%s -> %s", (input, expected) => {
    expect(safeReturnPath(input)).toBe(expected);
  });
});
