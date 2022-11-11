import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStatus from '../hooks/useAuthStatus';
import Spinner from './ui/Spinner';

function PrivateRoute() {
  const { checkingStatus, isLoggedIn } = useAuthStatus();

  console.log('inside private route');
  if (checkingStatus) return <Spinner />;

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
