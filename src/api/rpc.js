/**
 * Promise layer over the RemotePy client for the classic features.
 *
 *   const model = await rpc("getModel", [token(), modelId]);
 *
 * Names without a namespace are TalkMotionServer functions. Besides the transport errors the
 * client raises (timeout, disconnected, not_available, ...), many server functions report a
 * failure inside a normal return value ({error}, {success: false}, {ok: false},
 * {status: "fail"}, {operation_status, error}); those reject too, unless `raw: true`.
 */
import JS2Py, { RpcError } from "../remotepyjs";

export { RpcError };

/** Fired when a call reports the classic session is gone; useClassicSession re-checks. */
export const CLASSIC_AUTH_EXPIRED_EVENT = "tm:classic-auth-expired";
const AUTH_GONE = /user not authenticated|not logged in|session (has )?expired|invalid session/i;
let lastExpiredEventAt = 0;

function noteAuthFailure(message) {
  if (!AUTH_GONE.test(String(message || ""))) return;
  const now = Date.now();
  if (now - lastExpiredEventAt < 5000) return;
  lastExpiredEventAt = now;
  globalThis.dispatchEvent?.(new CustomEvent(CLASSIC_AUTH_EXPIRED_EVENT));
}

const fullName = (name) => (name.includes(".") ? name : `TalkMotionServer.${name}`);

/** The classic RemotePy session id, or null. useLocalStorage can store "undefined"/"null". */
export function sessionToken() {
  try {
    const raw = globalThis.localStorage?.getItem("token");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  } catch {
    return null;
  }
}

/** Whether a successful RPC return value is actually a failure report. */
export function isFailurePayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.success === false || value.ok === false) return true;
  if (value.status === "fail" || value.status === "error") return true;
  return Boolean(value.error);
}

function failureMessage(value) {
  const e = value?.error;
  if (typeof e === "string" && e) return e;
  if (e && typeof e.message === "string") return e.message;
  if (typeof value?.operation_status === "string") return value.operation_status;
  return "The server reported an error";
}

/**
 * Call a server function. `args` are positional, as the server declares them (most classic
 * functions take the session token first).
 */
export async function rpc(name, args = [], { raw = false, timeoutMs } = {}) {
  const full = fullName(name);
  let value;
  try {
    value = await JS2Py.call(full, args, { timeoutMs });
  } catch (err) {
    if (err?.code === "server_error") noteAuthFailure(err.message);
    throw err;
  }
  if (!raw && isFailurePayload(value)) {
    const message = failureMessage(value);
    noteAuthFailure(message);
    throw new RpcError("server_error", message, { funcName: full, detail: value });
  }
  return value;
}

/** Whether the connected server provides `name`. False until the library has loaded. */
export const hasRpc = (name) => JS2Py.has(fullName(name));

/** Resolves when the server's function library is loaded. */
export const rpcReady = (timeoutMs) => JS2Py.ready(timeoutMs);

/** A sentence for people, for any error an rpc() call can reject with. */
export function rpcErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  switch (err.code) {
    case "timeout":
      return "The server took too long to answer. Please try again.";
    case "disconnected":
    case "not_connected":
      return "We lost the connection to the server. Check your connection and try again.";
    case "not_available":
      return "This feature is not available on the server yet.";
    case "server_error": {
      const msg = String(err.message || "");
      if (/not authenticated|not logged in|session/i.test(msg)) return "Your session has expired. Please sign in again.";
      if (/permission|not allowed|denied|not the owner|do not own/i.test(msg)) return "You don't have permission to do that.";
      // Server messages are mostly short sentences; hide stack traces and SQL.
      if (msg && msg.length <= 160 && !/Traceback|SELECT |INSERT |Exception|\bat line\b/i.test(msg)) return msg;
      return fallback;
    }
    default:
      return err.message && err.message.length <= 160 ? err.message : fallback;
  }
}

/**
 * Unwrap the `[rows, {"count(*)": n}]` (or `[rows, n]`) shape many list functions return.
 * Returns { rows, total }.
 */
export function unwrapList(value) {
  if (!Array.isArray(value)) return { rows: [], total: 0 };
  if (value.length === 2 && Array.isArray(value[0]) && !Array.isArray(value[1])) {
    const meta = value[1];
    let total = value[0].length;
    if (typeof meta === "number") total = meta;
    else if (meta && typeof meta === "object") {
      const n = Number(meta["count(*)"] ?? meta.count ?? meta.total);
      if (Number.isFinite(n)) total = n;
    }
    return { rows: value[0], total };
  }
  return { rows: value, total: value.length };
}
