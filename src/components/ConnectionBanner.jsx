import React, { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isRemotePyOptionalPath } from "../config/layoutConfig";
import { RECONNECT_NOW_EVENT } from "../hooks/useServerConnection";

function useSecondsUntil(timestamp) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!timestamp) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timestamp]);
  return timestamp ? Math.max(0, Math.ceil((timestamp - now) / 1000)) : null;
}

/**
 * Non-blocking notice while the RemotePy socket is down after having connected. The page
 * stays mounted underneath; calls made meanwhile wait for the connection (within their
 * timeout) and pages show their own errors if they give up.
 */
export default function ConnectionBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const { phase, everConnected, nextRetryAt } = useSelector((s) => s.server);
  const seconds = useSecondsUntil(phase === "connected" ? null : nextRetryAt);

  if (!everConnected || phase === "connected" || isRemotePyOptionalPath(location.pathname)) return null;

  const offline = phase === "offline";
  const message = offline
    ? t("server.bannerOffline", "You're offline from the TalkMotion server.")
    : t("server.bannerReconnecting", "Reconnecting to the TalkMotion server…");
  const description =
    seconds != null && seconds > 0
      ? t("server.bannerRetryIn", "Trying again in {{seconds}} s. Your work on this page is kept.", { seconds })
      : t("server.bannerKept", "Your work on this page is kept.");

  return (
    <div className="tm-connection-banner" role="status" aria-live="polite">
      <Alert
        type={offline ? "error" : "warning"}
        showIcon
        message={message}
        description={description}
        action={
          <Button size="small" onClick={() => window.dispatchEvent(new CustomEvent(RECONNECT_NOW_EVENT))}>
            {t("server.tryAgain", "Try again")}
          </Button>
        }
      />
    </div>
  );
}
