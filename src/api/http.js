/**
 * REST client for the TalkMotion 2.0 API (server/api). Runs alongside the RemotePy socket
 * during the migration.
 *
 * - Bearer access token, refreshed once on 401 (single flight across concurrent calls).
 * - Every call has a timeout, so an unreachable API never blocks the legacy app.
 * - A failed refresh clears tokens and fires the `tm:auth-expired` window event.
 */

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export const ACCESS_TOKEN_KEY = "tm_access_token";
export const REFRESH_TOKEN_KEY = "tm_refresh_token";
export const AUTH_EXPIRED_EVENT = "tm:auth-expired";
const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(status, body) {
    const detail = body && typeof body.detail === "string" ? body.detail : null;
    super(detail || (status ? `HTTP ${status}` : "Network error"));
    this.name = "ApiError";
    this.status = status; // 0 = network error or timeout
    this.body = body;
  }
}

function read(key) {
  try {
    return globalThis.localStorage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value) globalThis.localStorage?.setItem(key, value);
    else globalThis.localStorage?.removeItem(key);
  } catch {
    // storage unavailable
  }
}

export const getAccessToken = () => read(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => read(REFRESH_TOKEN_KEY);
export const hasStoredSession = () => Boolean(getRefreshToken());

export function setTokens(tokens) {
  write(ACCESS_TOKEN_KEY, tokens?.access_token);
  write(REFRESH_TOKEN_KEY, tokens?.refresh_token);
}

export function clearTokens() {
  write(ACCESS_TOKEN_KEY, null);
  write(REFRESH_TOKEN_KEY, null);
}

async function rawFetch(
  path,
  { method = "GET", body, auth = true, token, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // `token` overrides the stored access token (e.g. a guest's conversation token).
  const bearer = token || (auth ? getAccessToken() : null);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(0, { detail: err?.name === "AbortError" ? "timeout" : "network_error" });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

let refreshInFlight = null;

export function refreshTokens() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh_token = getRefreshToken();
      if (!refresh_token) throw new ApiError(401, { detail: "No refresh token" });
      const tokens = await rawFetch("/auth/refresh", { method: "POST", body: { refresh_token }, auth: false });
      setTokens(tokens);
      return tokens.access_token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch(path, options = {}) {
  try {
    return await rawFetch(path, options);
  } catch (err) {
    // Guest tokens can't be refreshed; only the stored user session can.
    const canRetry =
      err.status === 401 && options.auth !== false && options.retry !== false && !options.token;
    if (!canRetry || !getRefreshToken()) throw err;
    try {
      await refreshTokens();
    } catch (refreshErr) {
      // Only a rejected refresh token ends the session; a network blip keeps it.
      if (refreshErr.status === 401 || refreshErr.status === 403) {
        clearTokens();
        globalThis.dispatchEvent?.(new CustomEvent(AUTH_EXPIRED_EVENT));
      }
      throw err;
    }
    return rawFetch(path, { ...options, retry: false });
  }
}

/** WebSocket URL for an API socket path such as `/ws/conversations/<id>`. */
export function wsUrl(path, token = getAccessToken()) {
  let origin;
  if (import.meta.env.VITE_API_WS_URL) {
    origin = import.meta.env.VITE_API_WS_URL.replace(/\/+$/, "");
  } else if (/^https?:\/\//.test(API_BASE)) {
    origin = new URL(API_BASE).origin.replace(/^http/, "ws");
  } else {
    origin = window.location.origin.replace(/^http/, "ws");
  }
  const url = `${origin}${path}`;
  return token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;
}
