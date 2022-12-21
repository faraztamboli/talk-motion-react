import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStatus from "../hooks/useAuthStatus";
import Spinner from "./ui/Spinner";

function PrivateRoute() {
  const { checkingStatus, loggedIn } = useAuthStatus();

  if (checkingStatus) return <Spinner />;

  return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
