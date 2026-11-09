import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemotePyClient, RpcError } from "./index";

class FakeSocket {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.readyState = 0;
    FakeSocket.instances.push(this);
  }
  send(data) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1006 });
  }
  // test helpers
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  reply(funcName, body) {
    this.onmessage?.({ data: JSON.stringify({ funcName, ...body }) });
  }
  last(funcName) {
    return [...this.sent].reverse().find((m) => m.funcName === funcName);
  }
  count(funcName) {
    return this.sent.filter((m) => m.funcName === funcName).length;
  }
}

const LIBRARY = {
  "TalkMotionServer.getModel": ["self", "sessionid", "model_id"],
  "TalkMotionServer.getModelConcepts": ["self", "sessionid", "model_id"],
  "TalkMotionServer.loadModel2": ["self", "session_id", "model_id"],
};

function connected() {
  const client = new RemotePyClient("wss://test");
  client.connect();
  const socket = FakeSocket.instances.at(-1);
  socket.open();
  socket.reply("getPythonFunctionLibrary", { return: LIBRARY });
  return { client, socket };
}

beforeEach(() => {
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RemotePyClient", () => {
  it("loads the library into proxies and strips self and session_id", () => {
    const { client } = connected();
    expect(client.libraryLoaded).toBe(true);
    expect(client.has("TalkMotionServer.getModel")).toBe(true);
    expect(client.PythonFunctionsArgs["TalkMotionServer.loadModel2"]).toEqual(["model_id"]);
    expect(typeof client.PythonFunctions.TalkMotionServer.getModel).toBe("function");
  });

  it("maps positional arguments to parameter names and resolves the return value", async () => {
    const { client, socket } = connected();
    const p = client.call("TalkMotionServer.getModel", ["tok", 7]);
    expect(socket.last("TalkMotionServer.getModel").args).toEqual({ sessionid: "tok", model_id: 7 });
    socket.reply("TalkMotionServer.getModel", { return: [{ id: 7 }] });
    await expect(p).resolves.toEqual([{ id: 7 }]);
  });

  it("serializes calls to the same function so replies cannot cross", async () => {
    const { client, socket } = connected();
    const first = client.call("TalkMotionServer.getModel", ["tok", 1]);
    const second = client.call("TalkMotionServer.getModel", ["tok", 2]);
    expect(socket.count("TalkMotionServer.getModel")).toBe(1);
    socket.reply("TalkMotionServer.getModel", { return: "model-1" });
    await expect(first).resolves.toBe("model-1");
    expect(socket.count("TalkMotionServer.getModel")).toBe(2);
    expect(socket.last("TalkMotionServer.getModel").args.model_id).toBe(2);
    socket.reply("TalkMotionServer.getModel", { return: "model-2" });
    await expect(second).resolves.toBe("model-2");
  });

  it("runs different functions in parallel", () => {
    const { client, socket } = connected();
    client.call("TalkMotionServer.getModel", ["tok", 1]);
    client.call("TalkMotionServer.getModelConcepts", ["tok", 1]);
    expect(socket.count("TalkMotionServer.getModel")).toBe(1);
    expect(socket.count("TalkMotionServer.getModelConcepts")).toBe(1);
  });

  it("rejects server errors with an RpcError", async () => {
    const { client, socket } = connected();
    const p = client.call("TalkMotionServer.getModel", ["tok", 1]);
    socket.reply("TalkMotionServer.getModel", { error: "Model not found" });
    await expect(p).rejects.toMatchObject({ name: "RpcError", code: "server_error", message: "Model not found" });
  });

  it("times out, then drops the late reply instead of giving it to the next caller", async () => {
    const { client, socket } = connected();
    const slow = client.call("TalkMotionServer.getModel", ["tok", 1], { timeoutMs: 1000 });
    const next = client.call("TalkMotionServer.getModel", ["tok", 2], { timeoutMs: 10000 });
    vi.advanceTimersByTime(1001);
    await expect(slow).rejects.toMatchObject({ code: "timeout" });
    expect(socket.count("TalkMotionServer.getModel")).toBe(1); // still draining
    socket.reply("TalkMotionServer.getModel", { return: "late reply for 1" });
    expect(socket.count("TalkMotionServer.getModel")).toBe(2);
    socket.reply("TalkMotionServer.getModel", { return: "reply for 2" });
    await expect(next).resolves.toBe("reply for 2");
  });

  it("frees a draining slot after the drain deadline when the late reply never comes", () => {
    const { client, socket } = connected();
    client.call("TalkMotionServer.getModel", ["tok", 1], { timeoutMs: 1000 }).catch(() => {});
    client.call("TalkMotionServer.getModel", ["tok", 2], { timeoutMs: 60000 }).catch(() => {});
    vi.advanceTimersByTime(1001);
    expect(socket.count("TalkMotionServer.getModel")).toBe(1);
    vi.advanceTimersByTime(2000);
    expect(socket.count("TalkMotionServer.getModel")).toBe(2);
  });

  it("rejects functions the server does not have", async () => {
    const { client } = connected();
    await expect(client.call("TalkMotionServer.nope", [])).rejects.toMatchObject({ code: "not_available" });
  });

  it("waits for the connection instead of dropping early calls", async () => {
    const client = new RemotePyClient("wss://test");
    const p = client.call("TalkMotionServer.getModel", ["tok", 3]);
    client.connect();
    const socket = FakeSocket.instances.at(-1);
    socket.open();
    socket.reply("getPythonFunctionLibrary", { return: LIBRARY });
    await vi.waitFor(() => expect(socket.count("TalkMotionServer.getModel")).toBe(1));
    socket.reply("TalkMotionServer.getModel", { return: "ok" });
    await expect(p).resolves.toBe("ok");
  });

  it("gives up on early calls when no connection arrives in time", async () => {
    const client = new RemotePyClient("wss://test");
    const p = client.call("TalkMotionServer.getModel", ["tok", 3], { timeoutMs: 500 });
    vi.advanceTimersByTime(501);
    await expect(p).rejects.toMatchObject({ code: "not_connected" });
  });

  it("fails in-flight calls when the socket closes", async () => {
    const { client, socket } = connected();
    const p = client.call("TalkMotionServer.getModel", ["tok", 1]);
    socket.close();
    await expect(p).rejects.toMatchObject({ code: "disconnected" });
    expect(client.isOpen).toBe(false);
    expect(client.libraryLoaded).toBe(false);
  });

  it("legacy proxies: one callback gets an error object, two callbacks split result and error", () => {
    const { client, socket } = connected();
    const single = vi.fn();
    client.PythonFunctions.TalkMotionServer.getModel("tok", 1, single);
    socket.reply("TalkMotionServer.getModel", { error: "boom" });
    expect(single).toHaveBeenCalledWith({ error: "boom", rpcError: true, code: "server_error" }, false);

    const ok = vi.fn();
    const bad = vi.fn();
    client.PythonFunctions.TalkMotionServer.getModel("tok", 1, ok, bad);
    socket.reply("TalkMotionServer.getModel", { error: "nope" });
    expect(ok).not.toHaveBeenCalled();
    expect(bad).toHaveBeenCalledWith("nope", false);
  });

  it("legacy proxies go through the same queue", () => {
    const { client, socket } = connected();
    const a = vi.fn();
    const b = vi.fn();
    client.PythonFunctions.TalkMotionServer.getModel("tok", 1, a);
    client.PythonFunctions.TalkMotionServer.getModel("tok", 2, b);
    socket.reply("TalkMotionServer.getModel", { return: "one" });
    socket.reply("TalkMotionServer.getModel", { return: "two" });
    expect(a).toHaveBeenCalledWith("one", false);
    expect(b).toHaveBeenCalledWith("two", false);
  });

  it("a null return resolves to null", async () => {
    const { client, socket } = connected();
    const p = client.call("TalkMotionServer.getModel", ["tok", 1]);
    socket.reply("TalkMotionServer.getModel", {});
    await expect(p).resolves.toBeNull();
  });

  it("dispatches server pushes and replaces a re-registered handler", () => {
    const { client, socket } = connected();
    const first = vi.fn();
    const second = vi.fn();
    client.registerJSFunctionToBeCalledByPython("jsOnUpdateTrainingStatus", first);
    client.registerJSFunctionToBeCalledByPython("jsOnUpdateTrainingStatus", second);
    socket.onmessage({ data: JSON.stringify({ funcName: "jsOnUpdateTrainingStatus", args: { index: 1 } }) });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ index: 1 });
  });

  it("RpcError is an Error", () => {
    const e = new RpcError("timeout", "slow");
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("timeout");
  });
});
