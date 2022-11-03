import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStatus from '../hooks/useAuthStatus';
import Spinner from './ui/Spinner';

function PrivateRoute() {
  const { checkingStatus, loggedIn } = useAuthStatus();

  console.log('inside private route');
  if (checkingStatus) return <Spinner />;

  return loggedIn ? <Outlet /> : <Navigate to="/signin" />;
}

export default PrivateRoute;
