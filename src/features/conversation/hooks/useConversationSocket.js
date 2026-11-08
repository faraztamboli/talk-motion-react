import { useCallback, useEffect, useRef, useState } from "react";
import { refreshTokens, wsUrl } from "../../../api/http";
import { envelope } from "../protocol";

// Close codes from the server (see conversations_ws.py). These mean "don't retry".
const FINAL_CLOSE_CODES = new Set([1000, 4403, 4404, 4409]);
const UNAUTHORIZED = 4401;
const MAX_QUEUE = 50;

export function backoffDelay(attempt, random = Math.random) {
  const base = Math.min(30000, 1000 * 2 ** attempt);
  return base / 2 + random() * (base / 2);
}

/**
 * One WebSocket per participant per conversation, with reconnect.
 *
 * @param {object} opts
 * @param {string} opts.conversationId
 * @param {() => string|null} opts.getToken   token for each (re)connect
 * @param {boolean} opts.canRefresh           refresh the user session on 4401 (not for guests)
 * @param {(msg: object) => void} opts.onMessage
 * @param {(data: ArrayBuffer) => void} opts.onBinary
 * @param {(status: string) => void} opts.onStatus   connecting | open | reconnecting | closed
 * @param {() => void} opts.onOpen            after every successful (re)connect
 */
export default function useConversationSocket({
  conversationId,
  getToken,
  canRefresh = false,
  enabled = true,
  onMessage,
  onBinary,
  onStatus,
  onOpen,
}) {
  const [status, setStatus] = useState("idle");
  const wsRef = useRef(null);
  const queueRef = useRef([]);
  const attemptRef = useRef(0);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const handlers = useRef({});
  handlers.current = { getToken, onMessage, onBinary, onStatus, onOpen };

  const report = useCallback((next) => {
    setStatus(next);
    handlers.current.onStatus?.(next);
  }, []);

  useEffect(() => {
    if (!enabled || !conversationId) return undefined;
    stoppedRef.current = false;

    const scheduleReconnect = () => {
      report("reconnecting");
      const wait = backoffDelay(attemptRef.current);
      attemptRef.current += 1;
      timerRef.current = setTimeout(connect, wait);
    };

    function connect() {
      if (stoppedRef.current) return;
      report(attemptRef.current === 0 ? "connecting" : "reconnecting");
      const ws = new WebSocket(wsUrl(`/ws/conversations/${conversationId}`, handlers.current.getToken()));
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        report("open");
        const pending = queueRef.current.splice(0);
        pending.forEach((frame) => ws.send(frame));
        handlers.current.onOpen?.();
      };
      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            handlers.current.onMessage?.(JSON.parse(event.data));
          } catch {
            // ignore malformed frames
          }
        } else {
          handlers.current.onBinary?.(event.data);
        }
      };
      ws.onclose = (event) => {
        wsRef.current = null;
        if (stoppedRef.current) return;
        if (FINAL_CLOSE_CODES.has(event.code)) {
          report("closed");
          return;
        }
        if (event.code === UNAUTHORIZED) {
          if (!canRefresh) {
            report("closed");
            return;
          }
          refreshTokens().then(connect, () => report("closed"));
          return;
        }
        scheduleReconnect();
      };
    }

    connect();
    return () => {
      stoppedRef.current = true;
      clearTimeout(timerRef.current);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close(1000);
      }
      report("idle");
    };
  }, [conversationId, enabled, canRefresh, report]);

  /** Send a JSON message; queued while reconnecting (audio is never queued). */
  const send = useCallback((type, payload = {}) => {
    const frame = JSON.stringify(envelope(type, payload));
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(frame);
      return true;
    }
    if (queueRef.current.length < MAX_QUEUE) queueRef.current.push(frame);
    return false;
  }, []);

  const sendBinary = useCallback((data) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      return true;
    }
    return false;
  }, []);

  return { status, send, sendBinary };
}
