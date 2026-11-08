import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "antd";
import useAuthStatus from "../hooks/useAuthStatus";

const skeletonStyle = { padding: "24px", height: "90vh" };

/** Legacy pages: requires a RemotePy session (unchanged behaviour). */
function RemotePyGuard() {
  const { checkingStatus, loggedIn } = useAuthStatus();
  if (checkingStatus) return <Skeleton active style={skeletonStyle} />;
  return loggedIn ? <Outlet /> : <Navigate to="/login" />;
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
