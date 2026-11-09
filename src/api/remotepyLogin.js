/**
 * One sign-in: the TalkMotion 2.0 API is the login authority and RemotePy trusts its tokens.
 *
 * After a successful API login, an access token that carries `lu` (the legacy RemotePy
 * username) signs the RemotePy session in through TalkMotionServer.loginWithApiToken, so the
 * password never goes to RemotePy. Everything else keeps the password validateLogin it always
 * used: the API is down or refused, the account is API-only (no `lu`), or the RemotePy server
 * is older than the RPC, rejects the token, errors or does not answer.
 */

export const LOGIN_PAGE_URL = "https://app.talk-motion.com/login";
export const AFTER_LOGIN_URL = "https://app.talk-motion.com";
export const TOKEN_LOGIN_TIMEOUT_MS = 8000;
/** How long classic login waits for the API before RemotePy gets the password as before. */
export const API_LOGIN_WAIT_MS = 6000;

/** `promise`'s value if it settles within `ms`, otherwise `fallback` (the promise keeps going). */
export function settleWithin(promise, ms, fallback) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

export class RemotePyLoginError extends Error {
  constructor(reason, cause) {
    super(`loginWithApiToken ${reason}`);
    this.name = "RemotePyLoginError";
    this.reason = reason; // missing | error | timeout
    this.cause = cause;
  }
}

/** The payload (middle segment, base64url JSON) of a JWT, or null. Not verified: the
 * browser only uses it to choose a path; RemotePy verifies the signature itself. */
export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

/** The legacy RemotePy username (`lu`) an API access token carries, or null. */
export function legacyUsernameOf(accessToken) {
  const lu = decodeJwtPayload(accessToken)?.lu;
  return typeof lu === "string" && lu ? lu : null;
}

/** "token" when RemotePy can be signed in with the API token, otherwise "password". */
export function chooseRemotePyLogin(api, accessToken) {
  return api?.ok && legacyUsernameOf(accessToken) ? "token" : "password";
}

export const isRemotePyLoginOk = (info) =>
  Boolean(info) && info.isValidUser === true && info.isPasswordCorrect === true;

/** Where a finished login goes: the classic dashboard when RemotePy accepted the session,
 * Conversation Mode for an API-only account that has it, otherwise the failure message. */
export function loginDestination(remotePyLoginInfo, apiOnlyConversation) {
  if (isRemotePyLoginOk(remotePyLoginInfo)) return "dashboard";
  return apiOnlyConversation ? "conversation" : "failed";
}

/** TalkMotionServer.loginWithApiToken as a promise. Rejects with RemotePyLoginError when the
 * server lacks the RPC (older RemotePy), reports an error, or does not answer in time. */
export function loginWithApiToken(js2py, sessionId, accessToken, { timeoutMs = TOKEN_LOGIN_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const rpc = js2py?.PythonFunctions?.TalkMotionServer?.loginWithApiToken;
    if (typeof rpc !== "function") {
      reject(new RemotePyLoginError("missing"));
      return;
    }
    let settled = false;
    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settle(value);
    };
    const timer = setTimeout(() => finish(reject, new RemotePyLoginError("timeout")), timeoutMs);
    try {
      rpc(
        sessionId,
        accessToken,
        (result) => finish(resolve, result),
        (error) => finish(reject, new RemotePyLoginError("error", error))
      );
    } catch (err) {
      finish(reject, new RemotePyLoginError("error", err));
    }
  });
}

/** The classic SessionServer.validateLogin with the password, as a promise. */
export function validateLoginWithPassword(js2py, sessionId, values) {
  return new Promise((resolve) => {
    js2py.PythonFunctions.SessionServer.validateLogin(
      sessionId,
      values.username,
      values.password,
      values.remember,
      LOGIN_PAGE_URL,
      AFTER_LOGIN_URL,
      (loginInfo) => resolve(loginInfo)
    );
  });
}

/**
 * Sign the RemotePy session in. `api` is useApiAuth's loginApi result ({ ok, flags }) and
 * `accessToken` the API access token it stored. Resolves { loginInfo, method }, where method
 * is "token" or "password" (the one whose result loginInfo is).
 */
export async function signInToRemotePy({ js2py, sessionId, values, api, accessToken, timeoutMs }) {
  if (chooseRemotePyLogin(api, accessToken) === "token") {
    try {
      const loginInfo = await loginWithApiToken(js2py, sessionId, accessToken, { timeoutMs });
      if (isRemotePyLoginOk(loginInfo)) return { loginInfo, method: "token" };
      console.warn("RemotePy refused the API token; signing in with the password instead");
    } catch (err) {
      console.warn(`RemotePy token sign-in unavailable (${err?.reason || err}); using the password`);
    }
  }
  const loginInfo = await validateLoginWithPassword(js2py, sessionId, values);
  return { loginInfo, method: "password" };
}
