import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { apiLogin, apiLogout, fetchMe } from "../api/auth";
import { AUTH_EXPIRED_EVENT, clearTokens, hasStoredSession } from "../api/http";
import {
  apiAuthFailed,
  apiAuthStarted,
  apiAuthSucceeded,
  apiAuthUnavailable,
} from "../app/features/apiAuthSlice";
import { clearServerFlags, setServerFlags } from "../app/features/flagsSlice";

/** Load the API user and their flags into the store. Flags first, so routes never see a
 * signed-in user with stale flags. */
async function establishSession(dispatch) {
  const me = await fetchMe();
  dispatch(setServerFlags(me.flags || {}));
  dispatch(
    apiAuthSucceeded({
      id: me.id,
      username: me.username,
      email: me.email,
      displayName: me.display_name,
    })
  );
  return me;
}

function handleSessionError(dispatch, err) {
  if (err?.status === 401 || err?.status === 403) {
    clearTokens();
    dispatch(clearServerFlags());
    dispatch(apiAuthUnavailable());
  } else {
    dispatch(apiAuthFailed(err?.message || "API unreachable"));
  }
}

/** Mount once (App). Restores a stored API session and reacts to expiry. */
export function useApiAuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (hasStoredSession()) {
      dispatch(apiAuthStarted());
      establishSession(dispatch).catch((err) => handleSessionError(dispatch, err));
    } else {
      dispatch(apiAuthUnavailable());
    }

    const onExpired = () => {
      dispatch(clearServerFlags());
      dispatch(apiAuthUnavailable());
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [dispatch]);
}

export default function useApiAuth() {
  const dispatch = useDispatch();

  /** Resolves { ok, flags }. Never rejects: the API is optional during the migration. */
  const loginApi = useCallback(
    async (username, password) => {
      dispatch(apiAuthStarted());
      try {
        await apiLogin(username, password);
        const me = await establishSession(dispatch);
        return { ok: true, flags: me.flags || {} };
      } catch (err) {
        handleSessionError(dispatch, err);
        return { ok: false, flags: {}, error: err };
      }
    },
    [dispatch]
  );

  const logoutApi = useCallback(() => {
    apiLogout();
    dispatch(clearServerFlags());
    dispatch(apiAuthUnavailable());
  }, [dispatch]);

  return { loginApi, logoutApi };
}
