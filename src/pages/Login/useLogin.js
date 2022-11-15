import { useState, useEffect } from 'react';
import JS2Py from '../../remotepyjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../app/features/loginSlice';
import useLocalStorage from '../../hooks/useLocalStorage';

function useLogin() {
  console.log(JS2Py);
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useLocalStorage('token', '');

  const navigate = useNavigate();
  const disptach = useDispatch();

  const handleLogin = res => {
    console.log(res);
    if (res && res.isValidUser === true && res.isPasswordCorrect === true) {
      // set multiple values in localStorage
      disptach(login({ token: token, user: 'admin', isLoggedIn: true }));
      navigate('/');
    } else if (res && !(res.isValidUser === true && res.isPasswordCorrect === true)) {
      console.log('Invalid Credentials');
      setLoading(false);
      setLoginError(true);
    }
  };

  const onFinish = values => {
    // console.log(values, isLoggedIn, token);
    setLoading(true);

    JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted('', res => console.log(res));
    JS2Py.PythonFunctions.SessionServer.getNewSessionId(res => {
      console.log(res);
      setToken(res);
    });

    JS2Py.PythonFunctions.SessionServer.validateLogin(
      token, // session id
      values.username,
      values.password,
      values.remember,
      'http://localhost:3000', // login url
      'http://localhost:3000/', // after login url
      function (res) {
        console.log(res);
        handleLogin(res);
      },
    );
  };
  useEffect(() => {
    forceUpdate({});
  }, []);

  return { onFinish, loginError, loading };
}

export default useLogin;
