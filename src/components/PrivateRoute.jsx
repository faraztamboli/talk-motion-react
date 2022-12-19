import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStatus from "../hooks/useAuthStatus";
import Spinner from "./ui/Spinner";

function PrivateRoute() {
  const { checkingStatus, loggedIn } = useAuthStatus();
  console.log(loggedIn, checkingStatus, "inside private Route");

  console.log("inside private route");
  if (checkingStatus) return <Spinner />;

  return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
