import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AFTER_LOGIN_URL,
  LOGIN_PAGE_URL,
  chooseRemotePyLogin,
  decodeJwtPayload,
  legacyUsernameOf,
  loginDestination,
  loginWithApiToken,
  settleWithin,
  signInToRemotePy,
} from "./remotepyLogin";

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const jwt = (payload) => `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.c2lnbmF0dXJl`;

const LEGACY_TOKEN = jwt({ sub: "u1", type: "access", lu: "alice", exp: 9999999999 });
const NATIVE_TOKEN = jwt({ sub: "u2", type: "access", exp: 9999999999 });
const OK = { isValidUser: true, isPasswordCorrect: true, afterLoginUrl: AFTER_LOGIN_URL };
const REFUSED = { isValidUser: false, isPasswordCorrect: false, afterLoginUrl: null };
const VALUES = { username: "alice", password: "s3cret", remember: true };

/** A JS2Py stand-in. `token` is how loginWithApiToken answers: a result, an "error",
 * "silent" (never answers), "throws", or undefined for a server without the RPC. */
function fakeJs2Py({ token, password = OK } = {}) {
  const SessionServer = {
    validateLogin: vi.fn((sid, user, pass, remember, current, after, cb) => cb(password, false)),
  };
  const TalkMotionServer = {};
  if (token !== undefined) {
    TalkMotionServer.loginWithApiToken = vi.fn((sid, accessToken, onResult, onError) => {
      if (token === "error") onError("Traceback: boom", false);
      else if (token === "throws") throw new Error("socket closed");
      else if (token !== "silent") onResult(token, false);
    });
  }
  return { PythonFunctions: { SessionServer, TalkMotionServer } };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("decodeJwtPayload / legacyUsernameOf", () => {
  it("reads base64url JSON from the middle segment", () => {
    // Non-ASCII plus characters that base64url spells with - and _.
    const token = jwt({ lu: "zoë_??>~", n: 1 });
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(decodeJwtPayload(token)).toEqual({ lu: "zoë_??>~", n: 1 });
    expect(legacyUsernameOf(token)).toBe("zoë_??>~");
    expect(legacyUsernameOf(LEGACY_TOKEN)).toBe("alice");
  });

  it("returns null for anything that is not a JWT with an lu claim", () => {
    for (const bad of [undefined, null, 42, "", "abc", "a.b", "a.!!!.c", `x.${b64url([1, 2])}.y`, "a..c"]) {
      expect(decodeJwtPayload(bad)).toBeNull();
      expect(legacyUsernameOf(bad)).toBeNull();
    }
    expect(legacyUsernameOf(NATIVE_TOKEN)).toBeNull();
    expect(legacyUsernameOf(jwt({ lu: "" }))).toBeNull();
    expect(legacyUsernameOf(jwt({ lu: 7 }))).toBeNull();
  });
});

describe("chooseRemotePyLogin", () => {
  it("uses the token only after a successful API login whose token has lu", () => {
    expect(chooseRemotePyLogin({ ok: true }, LEGACY_TOKEN)).toBe("token");
    expect(chooseRemotePyLogin({ ok: true }, NATIVE_TOKEN)).toBe("password");
    expect(chooseRemotePyLogin({ ok: true }, null)).toBe("password");
    expect(chooseRemotePyLogin({ ok: false }, LEGACY_TOKEN)).toBe("password");
    expect(chooseRemotePyLogin(undefined, LEGACY_TOKEN)).toBe("password");
  });
});

describe("loginDestination", () => {
  it("keeps today's navigation", () => {
    expect(loginDestination(OK, false)).toBe("dashboard");
    expect(loginDestination(OK, true)).toBe("dashboard"); // existing users are never pushed into it
    expect(loginDestination(REFUSED, true)).toBe("conversation");
    expect(loginDestination(null, true)).toBe("conversation");
    expect(loginDestination(REFUSED, false)).toBe("failed");
    expect(loginDestination({ isValidUser: true, isPasswordCorrect: false }, false)).toBe("failed");
    expect(loginDestination("Traceback: boom", false)).toBe("failed");
  });
});

describe("loginWithApiToken", () => {
  it("resolves with the server's answer and passes the session id and token", async () => {
    const js2py = fakeJs2Py({ token: OK });
    await expect(loginWithApiToken(js2py, "sid-1", LEGACY_TOKEN)).resolves.toEqual(OK);
    const [sid, token] = js2py.PythonFunctions.TalkMotionServer.loginWithApiToken.mock.calls[0];
    expect([sid, token]).toEqual(["sid-1", LEGACY_TOKEN]);
  });

  it("rejects when the server has no such RPC, errors, throws, or stays silent", async () => {
    await expect(loginWithApiToken(fakeJs2Py(), "s", LEGACY_TOKEN)).rejects.toMatchObject({ reason: "missing" });
    await expect(loginWithApiToken({}, "s", LEGACY_TOKEN)).rejects.toMatchObject({ reason: "missing" });
    await expect(loginWithApiToken(fakeJs2Py({ token: "error" }), "s", LEGACY_TOKEN)).rejects.toMatchObject({
      reason: "error",
    });
    await expect(loginWithApiToken(fakeJs2Py({ token: "throws" }), "s", LEGACY_TOKEN)).rejects.toMatchObject({
      reason: "error",
    });
    await expect(
      loginWithApiToken(fakeJs2Py({ token: "silent" }), "s", LEGACY_TOKEN, { timeoutMs: 20 })
    ).rejects.toMatchObject({ reason: "timeout" });
  });

  it("ignores an answer that arrives after the timeout", async () => {
    vi.useFakeTimers();
    let answer;
    const js2py = { PythonFunctions: { TalkMotionServer: { loginWithApiToken: (s, t, onResult) => (answer = onResult) } } };
    const pending = loginWithApiToken(js2py, "s", LEGACY_TOKEN, { timeoutMs: 100 });
    vi.advanceTimersByTime(100);
    answer(OK);
    await expect(pending).rejects.toMatchObject({ reason: "timeout" });
  });
});

describe("signInToRemotePy", () => {
  const run = (js2py, api, accessToken) =>
    signInToRemotePy({ js2py, sessionId: "sid-9", values: VALUES, api, accessToken, timeoutMs: 20 });

  it("signs a legacy-linked account in with the token and never sends the password", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const js2py = fakeJs2Py({ token: OK });
    await expect(run(js2py, { ok: true }, LEGACY_TOKEN)).resolves.toEqual({ loginInfo: OK, method: "token" });
    expect(js2py.PythonFunctions.SessionServer.validateLogin).not.toHaveBeenCalled();
  });

  it.each([
    ["the server is older than the RPC", undefined],
    ["the RPC reports an error", "error"],
    ["the RPC throws", "throws"],
    ["the RPC never answers", "silent"],
    ["RemotePy refuses the token", REFUSED],
    ["RemotePy answers with junk", "Traceback"],
  ])("falls back to the password when %s", async (_label, token) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const js2py = fakeJs2Py({ token });
    await expect(run(js2py, { ok: true }, LEGACY_TOKEN)).resolves.toEqual({ loginInfo: OK, method: "password" });
    expect(js2py.PythonFunctions.SessionServer.validateLogin).toHaveBeenCalledWith(
      "sid-9", "alice", "s3cret", true, LOGIN_PAGE_URL, AFTER_LOGIN_URL, expect.any(Function)
    );
  });

  it("uses the password straight away when the API is down or the account has no lu", async () => {
    for (const [api, token] of [
      [{ ok: false }, null],
      [{ ok: false }, LEGACY_TOKEN], // a stale token from an earlier session is not used
      [{ ok: true }, NATIVE_TOKEN],
    ]) {
      const js2py = fakeJs2Py({ token: OK });
      await expect(run(js2py, api, token)).resolves.toEqual({ loginInfo: OK, method: "password" });
      expect(js2py.PythonFunctions.TalkMotionServer.loginWithApiToken).not.toHaveBeenCalled();
    }
  });

  it("returns RemotePy's password verdict as is", async () => {
    const js2py = fakeJs2Py({ password: REFUSED });
    await expect(run(js2py, { ok: false }, null)).resolves.toEqual({ loginInfo: REFUSED, method: "password" });
  });
});

describe("settleWithin", () => {
  it("passes a prompt value through, and falls back when slow or failed", async () => {
    await expect(settleWithin(Promise.resolve(1), 50, 0)).resolves.toBe(1);
    await expect(settleWithin(Promise.reject(new Error("x")), 50, 0)).resolves.toBe(0);
    await expect(settleWithin(new Promise(() => {}), 10, "late")).resolves.toBe("late");
  });
});
