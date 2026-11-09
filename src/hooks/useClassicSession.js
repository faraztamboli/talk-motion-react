import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import JS2Py from "../remotepyjs";
import { rpc, sessionToken, CLASSIC_AUTH_EXPIRED_EVENT } from "../api/rpc";
import { getAccessToken, refreshTokens } from "../api/http";
import { decodeJwtPayload, isRemotePyLoginOk, legacyUsernameOf } from "../api/remotepyLogin";
import { sessionChecked, ssoFinished, ssoStarted } from "../app/features/loginSlice";
import { setUser } from "../app/features/userSlice";

/** An API access token with at least a minute left, refreshed if needed; null if none. */
export async function freshAccessToken({ getToken = getAccessToken, refresh = refreshTokens } = {}) {
  const token = getToken();
  if (!token) return null;
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp === "number" && exp * 1000 - Date.now() > 60000) return token;
  try {
    return await refresh();
  } catch {
    return null;
  }
}

function writeSessionToken(token) {
  try {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  } catch {
    // storage unavailable; the session still works for this page
  }
}

/** Is the stored classic session still signed in? Resolves the isLoggedIn reply or null. */
export async function checkStoredSession(call = rpc, token = sessionToken()) {
  if (!token) return null;
  try {
    await call("SessionServer.startSessionIfNotStarted", [token], { raw: true });
  } catch {
    // older servers answer nothing useful here; isLoggedIn decides
  }
  const res = await call("SessionServer.isLoggedIn", [token], { raw: true });
  return res?.isLoggedIn === true ? res : null;
}

/**
 * Single sign-in: sign a fresh classic session in with the API access token. Only for
 * accounts linked to a legacy user (the token carries `lu`). Resolves the new session id and
 * isLoggedIn reply, or null.
 */
export async function signInWithApiToken({ call = rpc, accessToken }) {
  if (!accessToken || !legacyUsernameOf(accessToken)) return null;
  if (!JS2Py.has("TalkMotionServer.loginWithApiToken")) return null;
  const sessionId = await call("SessionServer.getNewSessionId", [], { raw: true });
  if (!sessionId || typeof sessionId !== "string") return null;
  const info = await call("TalkMotionServer.loginWithApiToken", [sessionId, accessToken], { raw: true });
  if (!isRemotePyLoginOk(info)) return null;
  writeSessionToken(sessionId);
  const res = await checkStoredSession(call, sessionId);
  return res ? { sessionId, res } : null;
}

/**
 * Mount once (App). Verifies the classic session each time the socket (re)connects, signs a
 * linked account in with its API token when there is no classic session, and re-verifies when
 * a call reports the session expired. Guards read state.login.{checked, isLoggedIn,
 * ssoInProgress}.
 */
export default function useClassicSession() {
  const dispatch = useDispatch();
  const phase = useSelector((s) => s.server.phase);
  const apiStatus = useSelector((s) => s.apiAuth.status);
  const { checked, isLoggedIn } = useSelector((s) => s.login);
  const running = useRef(false);
  const ssoTried = useRef(false);

  const connected = phase === "connected";

  // Verify the stored session on every (re)connect.
  useEffect(() => {
    if (!connected) return undefined;
    let cancelled = false;
    (async () => {
      running.current = true;
      try {
        const token = sessionToken();
        const res = await checkStoredSession(rpc, token).catch(() => null);
        if (cancelled) return;
        if (res) {
          dispatch(setUser({ username: res.user?.username, name: res.user?.first }));
          dispatch(sessionChecked({ isLoggedIn: true, token }));
        } else {
          dispatch(sessionChecked({ isLoggedIn: false }));
        }
      } finally {
        running.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, dispatch]);

  // Single sign-in once the classic check came back signed out and the API session is ready.
  useEffect(() => {
    if (!connected || !checked || isLoggedIn || apiStatus !== "authenticated" || ssoTried.current) return undefined;
    ssoTried.current = true;
    let cancelled = false;
    (async () => {
      dispatch(ssoStarted());
      try {
        const accessToken = await freshAccessToken();
        const result = await signInWithApiToken({ accessToken }).catch(() => null);
        if (cancelled || !result) return;
        dispatch(setUser({ username: result.res.user?.username, name: result.res.user?.first }));
        dispatch(sessionChecked({ isLoggedIn: true, token: result.sessionId }));
      } finally {
        dispatch(ssoFinished());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, checked, isLoggedIn, apiStatus, dispatch]);

  // A call said the session is gone: check again, and allow one more silent sign-in.
  useEffect(() => {
    const onExpired = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const res = await checkStoredSession().catch(() => null);
        if (!res) {
          ssoTried.current = false;
          dispatch(sessionChecked({ isLoggedIn: false }));
        }
      } finally {
        running.current = false;
      }
    };
    window.addEventListener(CLASSIC_AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(CLASSIC_AUTH_EXPIRED_EVENT, onExpired);
  }, [dispatch]);

  // Signing out of the API (or a new login) allows a fresh single sign-in later.
  useEffect(() => {
    if (apiStatus !== "authenticated") ssoTried.current = false;
  }, [apiStatus]);
}
