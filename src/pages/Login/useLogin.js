import { useState } from "react";
import JS2Py from "../../remotepyjs";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../../app/features/loginSlice";
import useLocalStorage from "../../hooks/useLocalStorage";

function useLogin() {
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useLocalStorage("token", "");

  const navigate = useNavigate();
  const disptach = useDispatch();

  function handleLogin(res) {
    console.log(res);
    if (res && res.isValidUser === true && res.isPasswordCorrect === true) {
      disptach(login({ token: token, user: "admin", isLoggedIn: true }));
      navigate("/");
    } else if (
      res &&
      !(res.isValidUser === true && res.isPasswordCorrect === true)
    ) {
      console.log("Invalid Credentials");
      setLoading(false);
      setLoginError(true);
    }
  }

  const onFinish = (values) => {
    setLoading(true);
    JS2Py.PythonFunctions.SessionServer.getNewSessionId(function (res) {
      console.log(res);
      setToken(() => res);
      JS2Py.PythonFunctions.SessionServer.validateLogin(
        res, // session id
        values.username,
        values.password,
        values.remember,
        "http://localhost:3000", // login url
        "http://localhost:3000/", // after login url
        function (res) {
          console.log(res);
          handleLogin(res);
        }
      );
    });
  };

  return { onFinish, loginError, loading };
}

export default useLogin;
