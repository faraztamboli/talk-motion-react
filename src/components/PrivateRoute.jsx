import React from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, Outlet } from "react-router-dom";
import { Button, Result, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import useAuthStatus from "../hooks/useAuthStatus";

const skeletonStyle = { padding: "24px", height: "90vh" };

/**
 * Shown on a classic page to someone signed in only to the TalkMotion 2.0 API (for example
 * an account created for Conversation Mode). Bouncing them to /login looked like being signed
 * out; this says what the page needs instead.
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

/** Legacy pages: requires a RemotePy session. */
function RemotePyGuard() {
  const { checkingStatus, loggedIn } = useAuthStatus();
  const apiStatus = useSelector((state) => state.apiAuth.status);
  if (checkingStatus) return <Skeleton active style={skeletonStyle} />;
  if (loggedIn) return <Outlet />;
  return apiStatus === "authenticated" ? <ClassicAccountNeeded /> : <Navigate to="/login" />;
}

/** TalkMotion 2.0 pages: requires an API (JWT) session; works without the RemotePy socket. */
function ApiGuard() {
  const status = useSelector((state) => state.apiAuth.status);
  if (status === "authenticating") return <Skeleton active style={skeletonStyle} />;
  return status === "authenticated" ? <Outlet /> : <Navigate to="/login" />;
}

/**
 * Route guard.
 * @param {"remotepy"|"api"} auth which session the page needs (default: remotepy)
 */
function PrivateRoute({ auth = "remotepy" }) {
  return auth === "api" ? <ApiGuard /> : <RemotePyGuard />;
}

export default PrivateRoute;
