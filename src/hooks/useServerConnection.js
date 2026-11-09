import { useEffect } from "react";
import { useDispatch } from "react-redux";
import JS2Py from "../remotepyjs";
import { connectionPhaseChanged } from "../app/features/serverSlice";

const MAX_DELAY_MS = 30000;
/** Failed attempts in a row before the app reports "offline" (it keeps retrying). */
export const OFFLINE_AFTER_ATTEMPTS = 4;

export function retryDelayMs(attempt) {
  return Math.min(1000 * 2 ** Math.max(0, attempt - 1), MAX_DELAY_MS);
}

/** Ask the mounted connection hook to reconnect now (the banner's "Try again"). */
export const RECONNECT_NOW_EVENT = "tm:remotepy-reconnect-now";

/**
 * Mount once (App). Opens the RemotePy socket and keeps it open: reconnects with exponential
 * backoff (1 s, 2 s, 4 s ... capped at 30 s) for as long as the page is open, and immediately
 * when the browser comes back online, the tab becomes visible, or the user asks.
 */
export default function useServerConnection() {
  const dispatch = useDispatch();

  useEffect(() => {
    JS2Py.serverName = import.meta.env.VITE_WS_SERVER_URL || "wss://app.talk-motion.com:8083";

    let attempt = 0;
    let retryTimer = null;
    let unmounted = false;
    let everConnected = false;

    const connectNow = () => {
      if (unmounted) return;
      clearTimeout(retryTimer);
      retryTimer = null;
      if (JS2Py.socket && JS2Py.socket.readyState <= 1) return; // connecting or open
      JS2Py.connect();
    };

    const scheduleRetry = () => {
      if (unmounted || retryTimer) return;
      attempt += 1;
      const delay = retryDelayMs(attempt);
      const phase = attempt >= OFFLINE_AFTER_ATTEMPTS ? "offline" : everConnected || attempt > 1 ? "reconnecting" : "connecting";
      dispatch(connectionPhaseChanged({ phase, attempt, nextRetryAt: Date.now() + delay }));
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectNow();
      }, delay);
    };

    // Fires once the function library has loaded on a fresh socket.
    JS2Py.onopen = () => {
      attempt = 0;
      everConnected = true;
      dispatch(connectionPhaseChanged({ phase: "connected", attempt: 0 }));
    };
    JS2Py.onclose = (event) => {
      if (unmounted) return;
      if (event?.code === 1000 && event?.reason === "Component unmounted") return;
      scheduleRetry();
    };
    JS2Py.onerror = () => {
      // onclose follows an error and schedules the retry.
    };

    const retryNowIfDown = () => {
      if (JS2Py.isOpen) return;
      attempt = Math.max(0, attempt - 1);
      connectNow();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") retryNowIfDown();
    };
    window.addEventListener("online", retryNowIfDown);
    window.addEventListener(RECONNECT_NOW_EVENT, retryNowIfDown);
    document.addEventListener("visibilitychange", onVisible);

    dispatch(connectionPhaseChanged({ phase: "connecting", attempt: 0 }));
    connectNow();

    return () => {
      unmounted = true;
      clearTimeout(retryTimer);
      window.removeEventListener("online", retryNowIfDown);
      window.removeEventListener(RECONNECT_NOW_EVENT, retryNowIfDown);
      document.removeEventListener("visibilitychange", onVisible);
      const socket = JS2Py.socket;
      if (socket && socket.readyState <= 1) socket.close(1000, "Component unmounted");
    };
  }, [dispatch]);
}
