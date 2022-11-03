import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../app/features/loginSlice';
import JS2Py from '../remotepyjs';

function useAuthStatus() {
  const { getSessionId, isLoggedIn } = JS2Py.PythonFunctions.SessionServer;
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const sessionId = getSessionId();
    if (isLoggedIn(sessionId)) {
      // if user is logged in, dispatch login action
      const loginPayload = {
        token: sessionId,
        user: '',
      };
      dispatch(login(loginPayload));
      setLoggedIn(true);
      setCheckingStatus(false);
    }
    //eslint-disable-next-line
  }, [loggedIn]);

  return { loggedIn, checkingStatus };
}

export default useAuthStatus;
