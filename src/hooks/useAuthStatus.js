import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../app/features/loginSlice';
// import JS2Py from '../remotepyjs';
import { useNavigate } from 'react-router-dom';
// function useAuthStatus() {
//   const { getSessionId, isLoggedIn } = JS2Py.PythonFunctions.SessionServer;
//   const [checkingStatus, setCheckingStatus] = useState(true);
//   const [loggedIn, setLoggedIn] = useState(false);

//   const dispatch = useDispatch();

//   useEffect(() => {
//     const sessionId = getSessionId();
//     if (isLoggedIn(sessionId)) {
//       // if user is logged in, dispatch login action
//       const loginPayload = {
//         token: sessionId,
//         user: '',
//       };
//       dispatch(login(loginPayload));
//       setLoggedIn(true);
//       setCheckingStatus(false);
//     }
//     //eslint-disable-next-line
//   }, [loggedIn]);

//   return { loggedIn, checkingStatus };
// }

function useAuthStatus() {
  const isLoggedIn = useSelector(state => state.login.isLoggedIn);

  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  React.useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      // if user is logged in, dispatch login action
      const loginPayload = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
      };
      dispatch(login(loginPayload));
      setCheckingStatus(false);
    } else {
      setCheckingStatus(false);
    }
    //eslint-disable-next-line
  }, [isLoggedIn]);

  return { checkingStatus, isLoggedIn };
}

export default useAuthStatus;
