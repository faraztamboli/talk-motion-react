import React from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { Button, Result, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { RECONNECT_NOW_EVENT } from "../hooks/useServerConnection";

const skeletonStyle = { padding: "24px", height: "90vh" };

/**
 * Shown on a classic page to someone signed in only to the TalkMotion 2.0 API with an account
 * that has no classic (legacy) user. Linked accounts never see this: useClassicSession signs
 * them in to the classic server with their API token.
 */
function ClassicAccountNeeded() {
  const { t } = useTranslation();
  return (
    <Result
      status="info"
      title={t("auth.classicNeededTitle", "This part of TalkMotion needs your classic account")}
      subTitle={t(
        "auth.classicNeededBody",
        "You are signed in to Conversation Mode only. Sign in with your TalkMotion username and password to use models, courses and the Subtitle Designer."
      )}
      extra={[
        <Link key="conv" to="/conversation">
          <Button type="primary">{t("auth.goConversation", "Back to Conversation Mode")}</Button>
        </Link>,
        <Link key="login" to="/login">
          <Button>{t("auth.signInClassic", "Sign in with a TalkMotion account")}</Button>
        </Link>,
      ]}
    />
  );
}

/** The server never answered since the page loaded; signing in would not help. */
export function ServerUnavailable() {
  const { t } = useTranslation();
  return (
    <Result
      status="warning"
      title={t("server.unavailableTitle", "We can't reach the TalkMotion server")}
      subTitle={t(
        "server.unavailableBody",
        "This page needs the server. We'll keep trying in the background, or you can try again now."
      )}
      extra={
        <Button type="primary" onClick={() => window.dispatchEvent(new CustomEvent(RECONNECT_NOW_EVENT))}>
          {t("server.tryAgain", "Try again")}
        </Button>
      }
    />
  );
}

/** Legacy pages: requires a RemotePy session. */
function RemotePyGuard() {
  const location = useLocation();
  const { checked, isLoggedIn, ssoInProgress } = useSelector((state) => state.login);
  const { phase, everConnected } = useSelector((state) => state.server);
  const apiStatus = useSelector((state) => state.apiAuth.status);

  if (isLoggedIn) return <Outlet />;
  if (!checked) {
    // Not "signed out", only "not checked yet": wait for the socket and the session check.
    if (!everConnected && phase === "offline") return <ServerUnavailable />;
    return <Skeleton active style={skeletonStyle} />;
  }
  if (ssoInProgress || apiStatus === "authenticating") return <Skeleton active style={skeletonStyle} />;
  if (apiStatus === "authenticated") return <ClassicAccountNeeded />;
  return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
}

/** TalkMotion 2.0 pages: requires an API (JWT) session; works without the RemotePy socket. */
function ApiGuard() {
  const location = useLocation();
  const status = useSelector((state) => state.apiAuth.status);
  if (status === "authenticating") return <Skeleton active style={skeletonStyle} />;
  return status === "authenticated" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  );
}

/**
 * Route guard.
 * @param {"remotepy"|"api"} auth which session the page needs (default: remotepy)
 */
function PrivateRoute({ auth = "remotepy" }) {
  return auth === "api" ? <ApiGuard /> : <RemotePyGuard />;
}

export default PrivateRoute;
