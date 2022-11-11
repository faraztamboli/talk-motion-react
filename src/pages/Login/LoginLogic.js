import { useState, useEffect } from 'react';
import JS2Py from '../../remotepyjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../app/features/loginSlice';
import useLocalStorage from '../../hooks/useLocalStorage';

function LoginLogic() {
  console.log(JS2Py);
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', '');
  const [token, setToken] = useLocalStorage('token', '');

  const navigate = useNavigate();
  const disptach = useDispatch();

  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  const onFinish = values => {
    console.log(values, isLoggedIn, token);
    setLoading(true);
    const handleLogin = res => {
      console.log(res);
      if (res && res.isValidUser === true && res.isPasswordCorrect === true) {
        // set multiple values in localStorage
        setIsLoggedIn(true);
        // localStorage.setItem('isLoggedIn', true);
        setToken(guid());
        // localStorage.setItem('token', guid());
        disptach(login({ token: guid(), user: 'admin' }));
        navigate('/');
      } else if (res && !(res.isValidUser === true && res.isPasswordCorrect === true)) {
        console.log('Invalid Credentials');
        setIsLoggedIn(true);
        setToken(guid());
        setLoading(false);
        setLoginError(true);
      }
    };
    JS2Py.PythonFunctions.SessionServer.validateLogin(
      '', // session id
      values.username,
      values.password,
      values.remember,
      '', // login url
      '', // after login url
      res => {
        handleLogin(res);
        console.log(res);
      },
    );
  };
  useEffect(() => {
    forceUpdate({});
  }, []);

  return { onFinish, loginError, loading };
}

export default LoginLogic;
