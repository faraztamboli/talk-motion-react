import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStatus from "../hooks/useAuthStatus";
import { Skeleton } from "antd";

function PrivateRoute() {
  const skeletonStyle = { padding: "24px", height: "90vh" };
  const { checkingStatus, loggedIn } = useAuthStatus();

  if (checkingStatus) return <Skeleton active style={skeletonStyle} />;

  return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
