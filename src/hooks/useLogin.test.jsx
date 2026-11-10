import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setTokens } from "../api/http";

const m = vi.hoisted(() => ({
  js2py: { PythonFunctions: {} },
  loginApi: null,
  navigate: null,
  dispatch: null,
  open: null,
}));

vi.mock("../remotepyjs", () => ({ default: m.js2py }));
vi.mock("./useApiAuth", () => ({ default: () => ({ loginApi: m.loginApi }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => m.navigate, useLocation: () => ({ state: null }) }));
vi.mock("react-redux", () => ({ useDispatch: () => m.dispatch }));
vi.mock("antd", () => ({ message: { useMessage: () => [{ open: m.open }, null] } }));

import useLogin from "./useLogin";

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const jwt = (payload) => `${b64url({ alg: "HS256" })}.${b64url(payload)}.sig`;
const OK = { isValidUser: true, isPasswordCorrect: true, afterLoginUrl: "https://app.talk-motion.com" };
const REFUSED = { isValidUser: false, isPasswordCorrect: false, afterLoginUrl: null };
const VALUES = { username: "alice", password: "s3cret", remember: false };

/** API login stand-in: stores tokens like the real loginApi, resolves { ok, flags }. */
function apiAnswers({ ok, lu, flags = {} }) {
  return vi.fn(async () => {
    if (!ok) return { ok: false, flags: {} };
    setTokens({ access_token: jwt({ type: "access", ...(lu ? { lu } : {}) }), refresh_token: "r" });
    return { ok: true, flags };
  });
}

function remotePy({ token, password }) {
  m.js2py.PythonFunctions = {
    SessionServer: {
      getNewSessionId: vi.fn((cb) => cb("sid-1", false)),
      validateLogin: vi.fn((sid, u, p, remember, cur, after, cb) => cb(password, false)),
    },
    TalkMotionServer:
      token === undefined ? {} : { loginWithApiToken: vi.fn((sid, t, onResult) => onResult(token, false)) },
  };
  return m.js2py.PythonFunctions;
}

beforeEach(() => {
  m.navigate = vi.fn();
  m.dispatch = vi.fn();
  m.open = vi.fn();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

function submit() {
  const { result } = renderHook(() => useLogin());
  act(() => result.current.onFinish(VALUES));
  return result;
}

describe("useLogin", () => {
  it("signs a legacy account in to RemotePy with the API token, not the password", async () => {
    m.loginApi = apiAnswers({ ok: true, lu: "alice" });
    const rp = remotePy({ token: OK, password: OK });
    submit();
    await waitFor(() => expect(m.navigate).toHaveBeenCalledWith("/", { replace: true }), { timeout: 2500 });
    expect(rp.TalkMotionServer.loginWithApiToken).toHaveBeenCalledWith(
      "sid-1", expect.stringContaining("."), expect.any(Function), expect.any(Function)
    );
    expect(rp.SessionServer.validateLogin).not.toHaveBeenCalled();
    expect(m.dispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: { token: "sid-1" } }));
    expect(m.loginApi).toHaveBeenCalledWith("alice", "s3cret");
  });

  it("falls back to the password on a RemotePy server without the RPC", async () => {
    m.loginApi = apiAnswers({ ok: true, lu: "alice" });
    const rp = remotePy({ token: undefined, password: OK });
    submit();
    await waitFor(() => expect(m.navigate).toHaveBeenCalledWith("/", { replace: true }), { timeout: 2500 });
    expect(rp.SessionServer.validateLogin).toHaveBeenCalledWith(
      "sid-1", "alice", "s3cret", false, expect.any(String), expect.any(String), expect.any(Function)
    );
  });

  it("uses the password when the API is down, exactly as before", async () => {
    m.loginApi = apiAnswers({ ok: false });
    const rp = remotePy({ token: OK, password: OK });
    submit();
    await waitFor(() => expect(m.navigate).toHaveBeenCalledWith("/", { replace: true }), { timeout: 2500 });
    expect(rp.TalkMotionServer.loginWithApiToken).not.toHaveBeenCalled();
    expect(rp.SessionServer.validateLogin).toHaveBeenCalled();
  });

  it("sends an API-only account with Conversation Mode to /conversation", async () => {
    m.loginApi = apiAnswers({ ok: true, flags: { conversation_v2: true } });
    const rp = remotePy({ token: OK, password: REFUSED });
    submit();
    await waitFor(() => expect(m.navigate).toHaveBeenCalledWith("/conversation"));
    expect(rp.TalkMotionServer.loginWithApiToken).not.toHaveBeenCalled(); // no lu
    expect(m.dispatch).not.toHaveBeenCalled();
  });

  it("shows the failure message when neither side accepts the login", async () => {
    m.loginApi = apiAnswers({ ok: false });
    remotePy({ token: OK, password: REFUSED });
    const result = submit();
    await waitFor(() => expect(m.open).toHaveBeenCalledWith(expect.objectContaining({ type: "error" })));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(m.navigate).not.toHaveBeenCalled();
  });
});
