import { afterEach, describe, expect, it, vi } from "vitest";
import JS2Py, { RpcError } from "../remotepyjs";
import { isFailurePayload, rpc, rpcErrorMessage, sessionToken, unwrapList } from "./rpc";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("isFailurePayload", () => {
  it.each([
    [{ error: "nope" }, true],
    [{ success: false, error: "User not found" }, true],
    [{ ok: false }, true],
    [{ status: "fail", error: "x" }, true],
    [{ operation_status: "Could not clone model", error: "boom" }, true],
    [{ operation_status: "Model updated" }, false],
    [{ success: true }, false],
    [{ error: null, text: "hi" }, false],
    [[{ error: "a row field" }], false],
    ["plain string", false],
    [null, false],
  ])("%j -> %s", (value, expected) => {
    expect(isFailurePayload(value)).toBe(expected);
  });
});

describe("rpc", () => {
  it("prefixes TalkMotionServer and resolves the value", async () => {
    const spy = vi.spyOn(JS2Py, "call").mockResolvedValue({ model_id: 3 });
    await expect(rpc("createModel", ["t", "x"])).resolves.toEqual({ model_id: 3 });
    expect(spy).toHaveBeenCalledWith("TalkMotionServer.createModel", ["t", "x"], { timeoutMs: undefined });
  });

  it("keeps an explicit namespace", async () => {
    const spy = vi.spyOn(JS2Py, "call").mockResolvedValue(true);
    await rpc("SessionServer.isLoggedIn", ["t"]);
    expect(spy.mock.calls[0][0]).toBe("SessionServer.isLoggedIn");
  });

  it("rejects failure payloads with the server's message", async () => {
    vi.spyOn(JS2Py, "call").mockResolvedValue({ operation_status: "Could not clone model", error: "disk full" });
    await expect(rpc("cloneModel", [])).rejects.toMatchObject({ code: "server_error", message: "disk full" });
  });

  it("raw: true returns failure payloads as values", async () => {
    vi.spyOn(JS2Py, "call").mockResolvedValue({ text: null, error: "not_configured" });
    await expect(rpc("transcribeAudio", [], { raw: true })).resolves.toEqual({ text: null, error: "not_configured" });
  });
});

describe("sessionToken", () => {
  it("ignores the strings useLocalStorage writes for missing values", () => {
    localStorage.setItem("token", "undefined");
    expect(sessionToken()).toBeNull();
    localStorage.setItem("token", "null");
    expect(sessionToken()).toBeNull();
    localStorage.setItem("token", "abc123");
    expect(sessionToken()).toBe("abc123");
    localStorage.setItem("token", '"quoted"');
    expect(sessionToken()).toBe("quoted");
  });
});

describe("rpcErrorMessage", () => {
  it("explains transport failures", () => {
    expect(rpcErrorMessage(new RpcError("timeout"))).toMatch(/too long/);
    expect(rpcErrorMessage(new RpcError("disconnected"))).toMatch(/connection/);
    expect(rpcErrorMessage(new RpcError("not_available"))).toMatch(/not available/);
  });
  it("maps auth and permission messages and hides tracebacks", () => {
    expect(rpcErrorMessage(new RpcError("server_error", "User not authenticated"))).toMatch(/sign in/);
    expect(rpcErrorMessage(new RpcError("server_error", "Permission denied"))).toMatch(/permission/);
    expect(rpcErrorMessage(new RpcError("server_error", "Traceback (most recent call last): ..."), "Oops")).toBe("Oops");
    expect(rpcErrorMessage(new RpcError("server_error", "Model not found"))).toBe("Model not found");
  });
});

describe("unwrapList", () => {
  it("reads [rows, {count(*)}]", () => {
    expect(unwrapList([[{ id: 1 }], { "count(*)": 12 }])).toEqual({ rows: [{ id: 1 }], total: 12 });
  });
  it("reads [rows, n] and bare arrays", () => {
    expect(unwrapList([[1, 2], 5])).toEqual({ rows: [1, 2], total: 5 });
    expect(unwrapList([{ id: 1 }, { id: 2 }])).toEqual({ rows: [{ id: 1 }, { id: 2 }], total: 2 });
  });
  it("treats anything else as empty", () => {
    expect(unwrapList({ error: "x" })).toEqual({ rows: [], total: 0 });
    expect(unwrapList(null)).toEqual({ rows: [], total: 0 });
  });
});
