/********************************************************************************
*
*  © 2016 Farukh Tamboli. All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains the property of
* Farukh Tamboli. The intellectual and technical concepts contained herein are
* proprietary to Farukh Tamboli and may be covered by U.S. and Foreign Patents,
* patents in process, and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material is strictly
* forbidden unless prior written permission is obtained from Farukh Tamboli.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
*
********************************************************************************/

/**
 * RemotePy WebSocket client.
 *
 * The server (compiled remotepy) answers `{funcName, return}` or `{funcName, error}` with no
 * request id, so a reply can only be matched to its call by function name. This client keeps
 * that safe:
 *
 *  - Calls to the same function are serialized: at most one is on the wire per name, so the
 *    next reply for that name is always the reply to that call. Different names run in parallel.
 *  - Every call has a timeout. A timed-out call keeps its slot "draining" until its late reply
 *    arrives (and is dropped) or a drain deadline passes, so a late reply is never handed to the
 *    next caller of the same function.
 *  - Calls made before the socket is open wait for it (within their timeout) instead of being
 *    dropped. A closed socket fails every call that was on the wire.
 *  - `call()` returns a promise that rejects with an RpcError on server errors, timeouts,
 *    disconnects and functions the server does not have. Legacy proxy calls
 *    (`PythonFunctions.X.y(...args, onResult, onError)`) go through the same queue; with a single
 *    callback an error arrives as `{ error, rpcError: true }` instead of a bare string, so
 *    `result.error` checks work.
 */

import * as msgpack from "msgpack-lite";

export class RpcError extends Error {
  /**
   * @param {"server_error"|"timeout"|"disconnected"|"not_available"|"not_connected"|"bad_response"} code
   */
  constructor(code, message, { funcName, detail } = {}) {
    super(message || code);
    this.name = "RpcError";
    this.code = code;
    this.funcName = funcName;
    this.detail = detail;
  }
}

export const DEFAULT_TIMEOUT_MS = 30000;
const MAX_DRAIN_MS = 5 * 60 * 1000;

/** Per-function timeouts for calls known to run long on the server. */
export const FUNCTION_TIMEOUTS_MS = {
  "TalkMotionServer.train": 30 * 60 * 1000,
  "TalkMotionServer.train2": 30 * 60 * 1000,
  "TalkMotionServer.trainModelAsync": 60000,
  "TalkMotionServer.uploadGestureVideo": 5 * 60 * 1000,
  "TalkMotionServer.transcribeAudio": 90000,
  "TalkMotionServer.finalizeVideoRecordingShotUpload": 5 * 60 * 1000,
  "TalkMotionServer.uploadVideoRecordingShotChunk": 2 * 60 * 1000,
  "TalkMotionServer.closeVideoRecordingShotWithVideo": 5 * 60 * 1000,
  "TalkMotionServer.uploadConceptVideoChunk": 2 * 60 * 1000,
  "TalkMotionServer.finalizeConceptVideoUpload": 5 * 60 * 1000,
  "TalkMotionServer.getModelConcepts": 90000,
  "TalkMotionServer.getConceptDetails": 90000,
  "TalkMotionServer.getConceptSamples": 90000,
  "TalkMotionServer.cloneModel": 2 * 60 * 1000,
  "TalkMotionServer.deleteModel": 2 * 60 * 1000,
  "TalkMotionServer.purchaseCart": 60000,
  "TalkMotionServer.loadModel2": 90000,
  "TalkMotionServer.translateGestureSample": 45000,
  "TalkMotionServer.getConceptPose": 45000,
};

const debugEnabled = () => {
  try {
    return globalThis.localStorage?.getItem("tm_rpc_debug") === "1";
  } catch {
    return false;
  }
};

/** Split `(…params, …trailingFunctions)` into [params, callbacks]. */
function splitCallbacks(args) {
  let i = args.length - 1;
  while (i >= 0 && typeof args[i] === "function") i--;
  return [args.slice(0, i + 1), args.slice(i + 1)];
}

function errorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Server error";
  }
}

export class RemotePyClient {
  constructor(serverName = "ws://localhost:80", clientPageId = "wss") {
    this.serverName = serverName;
    this.clientPageId = clientPageId;
    this.socket = null;
    this.isOpen = false;
    this.libraryLoaded = false;

    /** Proxies: PythonFunctions.<Namespace>.<fn>(...args, ...callbacks) */
    this.PythonFunctions = {};
    /** "Namespace.fn" -> [paramName, ...] (self and a leading session_id removed) */
    this.PythonFunctionsArgs = {};

    this._jsFunctions = new Map(); // server -> browser pushes
    this._queues = new Map(); // name -> [pending call]
    this._slots = new Map(); // name -> in-flight or draining call
    this._readyWaiters = [];
    this._openWaiters = [];
    this._binaryQueue = [];
    this._stateListeners = new Set();

    // Optional hooks, kept for useServerConnection
    this.onopen = undefined;
    this.onclose = undefined;
    this.onerror = undefined;
  }

  getServerString() {
    return `${this.serverName}/${this.clientPageId}`;
  }

  getSessionId() {
    try {
      return sessionStorage.getItem("JS2PY_SESSION_ID");
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------ public API

  /** Whether the connected server exposes `name` ("TalkMotionServer.getModel"). */
  has(name) {
    return Object.prototype.hasOwnProperty.call(this.PythonFunctionsArgs, name);
  }

  /** Resolves once the server's function library is loaded (rejects after `timeoutMs`). */
  ready(timeoutMs = DEFAULT_TIMEOUT_MS) {
    if (this.libraryLoaded && this.isOpen) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject };
      waiter.timer = setTimeout(() => {
        this._readyWaiters = this._readyWaiters.filter((w) => w !== waiter);
        reject(new RpcError("not_connected", "The server is not connected"));
      }, timeoutMs);
      this._readyWaiters.push(waiter);
    });
  }

  /**
   * Call a server function by its full name with positional arguments.
   * Resolves with the return value; rejects with RpcError.
   */
  call(name, args = [], { timeoutMs } = {}) {
    const timeout = timeoutMs ?? FUNCTION_TIMEOUTS_MS[name] ?? DEFAULT_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
      const enqueuedAt = Date.now();
      const proceed = () => {
        if (!this.has(name)) {
          reject(new RpcError("not_available", `The server does not provide ${name}`, { funcName: name }));
          return;
        }
        const params = this._namedParams(name, args);
        this._enqueue({ name, params, timeout, resolve, reject, mode: "promise" });
      };
      if (this.libraryLoaded && this.isOpen) {
        proceed();
        return;
      }
      this.ready(timeout)
        .then(() => {
          if (Date.now() - enqueuedAt > timeout) {
            reject(new RpcError("not_connected", "The server is not connected", { funcName: name }));
          } else proceed();
        })
        .catch((err) => reject(err instanceof RpcError ? new RpcError(err.code, err.message, { funcName: name }) : err));
    });
  }

  /** Subscribe to connection state ({ isOpen, libraryLoaded }); returns an unsubscribe. */
  onStateChange(listener) {
    this._stateListeners.add(listener);
    return () => this._stateListeners.delete(listener);
  }

  /** Register a function the server may call (push). Re-registering replaces it. */
  registerJSFunctionToBeCalledByPython(funcName, func) {
    this._jsFunctions.set(funcName, func);
  }

  /** Legacy entry point used by the generated proxies. */
  callMultipleCallbackPythonFunction(funcName, params, ...callbacks) {
    const timeout = FUNCTION_TIMEOUTS_MS[funcName] ?? DEFAULT_TIMEOUT_MS;
    this._enqueue({ name: funcName, params: params || {}, timeout, callbacks, mode: "legacy" });
  }

  connect() {
    const url = this.getServerString();
    if (debugEnabled()) console.debug("[rpc] connecting", url);
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.isOpen = true;
      this._resolveOpenWaiters();
      this._emitState();
      // Load the function library first; it goes through the queue like any call.
      this._enqueue({
        name: "getPythonFunctionLibrary",
        params: {},
        timeout: DEFAULT_TIMEOUT_MS,
        mode: "internal",
        resolve: (funcDict) => this._loadLibrary(funcDict),
        reject: (err) => console.error("RemotePy: could not load the function library", err),
      });
      this._pumpAll();
    };

    socket.onmessage = (e) => {
      if (this.socket !== socket) return;
      this._handleMessage(e.data);
    };

    socket.onerror = (event) => {
      if (this.socket !== socket) return;
      this.isOpen = false;
      this._emitState();
      if (typeof this.onerror === "function") this.onerror(event);
    };

    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.isOpen = false;
      this.libraryLoaded = false;
      this.socket = null;
      this._failInFlight(new RpcError("disconnected", "The connection to the server was lost"));
      this._emitState();
      if (typeof this.onclose === "function") this.onclose(event);
    };
  }

  getServerAPI() {
    return this.PythonFunctions;
  }

  getService(name) {
    return this.PythonFunctions[name];
  }

  // ------------------------------------------------------------------ internals

  _emitState() {
    const state = { isOpen: this.isOpen, libraryLoaded: this.libraryLoaded };
    this._stateListeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error(err);
      }
    });
  }

  _resolveOpenWaiters() {
    const waiters = this._openWaiters;
    this._openWaiters = [];
    waiters.forEach((w) => w());
  }

  _namedParams(name, args) {
    const names = this.PythonFunctionsArgs[name] || [];
    const params = {};
    names.forEach((paramName, i) => {
      if (i < args.length) params[paramName] = args[i];
    });
    return params;
  }

  _loadLibrary(funcDict) {
    const argsByName = {};
    for (const key of Object.keys(funcDict || {})) {
      const params = Array.isArray(funcDict[key]) ? funcDict[key].slice() : [];
      params.shift(); // self
      if (params[0] === "session_id") params.shift(); // supplied by the envelope
      argsByName[key] = params;
    }
    this.PythonFunctionsArgs = argsByName;
    this.PythonFunctions = {};
    for (const name of Object.keys(argsByName)) {
      const proxy = (...all) => {
        const [positional, callbacks] = splitCallbacks(all);
        this.callMultipleCallbackPythonFunction(name, this._namedParams(name, positional), ...callbacks);
      };
      const parts = name.split(".");
      let ns = this.PythonFunctions;
      for (let i = 0; i < parts.length - 1; i++) {
        ns[parts[i]] = ns[parts[i]] || {};
        ns = ns[parts[i]];
      }
      ns[parts[parts.length - 1]] = proxy;
    }
    this.libraryLoaded = true;
    const waiters = this._readyWaiters;
    this._readyWaiters = [];
    waiters.forEach((w) => {
      clearTimeout(w.timer);
      w.resolve();
    });
    this._emitState();
    if (typeof this.onopen === "function") this.onopen();
  }

  _enqueue(call) {
    call.enqueuedAt = Date.now();
    // Calls waiting for a socket still honour their timeout.
    call.queueTimer = setTimeout(() => {
      const q = this._queues.get(call.name);
      if (q && q.includes(call)) {
        this._queues.set(call.name, q.filter((c) => c !== call));
        this._fail(call, new RpcError("not_connected", "The server is not connected", { funcName: call.name }));
      }
    }, call.timeout);
    const q = this._queues.get(call.name) || [];
    q.push(call);
    this._queues.set(call.name, q);
    this._pump(call.name);
  }

  _pumpAll() {
    for (const name of this._queues.keys()) this._pump(name);
  }

  _pump(name) {
    if (!this.isOpen || !this.socket) return;
    if (this._slots.has(name)) return;
    const q = this._queues.get(name);
    if (!q || q.length === 0) return;
    const call = q.shift();
    clearTimeout(call.queueTimer);
    this._send(call);
  }

  _send(call) {
    const payload = JSON.stringify({ funcName: call.name, args: call.params, session_id: this.getSessionId() });
    try {
      this.socket.send(payload);
    } catch (err) {
      this._fail(call, new RpcError("disconnected", "The connection to the server was lost", { funcName: call.name }));
      return;
    }
    if (debugEnabled()) console.debug("[rpc] →", call.name, call.params);
    call.state = "inflight";
    this._slots.set(call.name, call);
    call.timer = setTimeout(() => this._timeout(call), call.timeout);
  }

  _timeout(call) {
    if (this._slots.get(call.name) !== call || call.state !== "inflight") return;
    call.state = "draining";
    this._fail(call, new RpcError("timeout", `${call.name} did not answer in time`, { funcName: call.name }));
    // Hold the slot so the late reply is dropped rather than handed to the next caller.
    call.drainTimer = setTimeout(() => {
      if (this._slots.get(call.name) === call) {
        this._slots.delete(call.name);
        this._pump(call.name);
      }
    }, Math.min(call.timeout * 2, MAX_DRAIN_MS));
  }

  _release(call) {
    clearTimeout(call.timer);
    clearTimeout(call.drainTimer);
    if (this._slots.get(call.name) === call) this._slots.delete(call.name);
    this._pump(call.name);
  }

  _failInFlight(err) {
    const slots = Array.from(this._slots.values());
    this._slots.clear();
    slots.forEach((call) => {
      clearTimeout(call.timer);
      clearTimeout(call.drainTimer);
      if (call.state === "inflight") this._fail(call, new RpcError(err.code, err.message, { funcName: call.name }));
    });
    // Queued calls stay queued and go out when the socket is back (within their timeout).
  }

  _fail(call, err) {
    if (call.settled) return;
    call.settled = true;
    if (call.mode === "promise" || call.mode === "internal") {
      call.reject?.(err);
      return;
    }
    const cbs = call.callbacks || [];
    const legacyError = { error: err.message, rpcError: true, code: err.code };
    if (cbs.length >= 2) cbs[1](err.message, false);
    else if (cbs.length === 1) cbs[0](legacyError, false);
  }

  _succeed(call, value) {
    if (call.settled) return;
    call.settled = true;
    if (call.mode === "promise" || call.mode === "internal") call.resolve?.(value);
    else if (call.callbacks?.length) call.callbacks[0](value, false);
  }

  _decode(data) {
    if (data instanceof ArrayBuffer) {
      try {
        return msgpack.decode(new Uint8Array(data));
      } catch {
        return { binary: data };
      }
    }
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  _handleMessage(data) {
    const msg = this._decode(data);
    if (!msg) return;

    if (msg.binary) {
      const next = this._binaryQueue.shift();
      if (next) next.callback({ ...next.args, blob: new Blob([new Uint8Array(msg.binary)]) });
      return;
    }

    // Server -> browser push
    if (Object.prototype.hasOwnProperty.call(msg, "args")) {
      const fn = this._jsFunctions.get(msg.funcName);
      if (!fn) {
        if (msg.funcName !== "getPythonFunctionLibrary") console.warn("RemotePy: no handler for push", msg.funcName);
        return;
      }
      if (msg.args && typeof msg.args === "object" && "isBinary" in msg.args) {
        this._binaryQueue.push({ callback: fn, args: msg.args });
      } else {
        try {
          fn(msg.args);
        } catch (err) {
          console.error(`RemotePy push handler ${msg.funcName} failed`, err);
        }
      }
      return;
    }

    const call = this._slots.get(msg.funcName);
    if (!call) {
      if (debugEnabled()) console.debug("[rpc] reply with no caller", msg.funcName);
      return;
    }
    if (debugEnabled()) console.debug("[rpc] ←", msg.funcName, msg);

    if (call.state === "draining") {
      // The caller already got a timeout; this is its late reply. Drop it, free the slot.
      if (!("streaming" in msg) || msg.streaming === "end" || "error" in msg) this._release(call);
      return;
    }

    if ("streaming" in msg) {
      this._handleStreaming(call, msg);
      return;
    }

    if ("error" in msg && msg.error !== undefined && msg.error !== null) {
      this._fail(call, new RpcError("server_error", errorMessage(msg.error), { funcName: call.name, detail: msg.error }));
    } else {
      this._succeed(call, msg.return === undefined ? null : msg.return);
    }
    this._release(call);
  }

  _handleStreaming(call, msg) {
    const done = msg.streaming === "end" || "error" in msg;
    if (call.mode === "legacy") {
      const cbs = call.callbacks || [];
      if ("error" in msg) {
        (cbs[cbs.length >= 4 ? 3 : 0] || (() => {}))(msg.error, false);
      } else if (msg.streaming === "start") cbs[0]?.(msg.return, false);
      else if (msg.streaming === "row") cbs[1]?.(msg.stream_index, msg.stream_item, false);
      else if (msg.streaming === "end") cbs[2]?.(msg.stream_empty, false);
      if (done) {
        call.settled = true;
        this._release(call);
      }
      return;
    }
    call.stream = call.stream || { start: null, rows: [] };
    if (msg.streaming === "start") call.stream.start = msg.return;
    if (msg.streaming === "row") call.stream.rows.push(msg.stream_item);
    if ("error" in msg) {
      this._fail(call, new RpcError("server_error", errorMessage(msg.error), { funcName: call.name }));
      this._release(call);
    } else if (msg.streaming === "end") {
      this._succeed(call, call.stream);
      this._release(call);
    }
  }
}

const JS2Py = new RemotePyClient();

export default JS2Py;
