import { useState } from "react";
import JS2Py from "../remotepyjs";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../app/features/loginSlice";
import useLocalStorage from "./useLocalStorage";

function useLogin() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useLocalStorage("token", "");
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();
  const disptach = useDispatch();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Login Successfull!",
    });
  };

  const failure = () => {
    messageApi.open({
      type: "error",
      content: "Invalid username or password",
    });
  };

  function handleLogin(res) {
    console.log(res);
    if (res && res.isValidUser === true && res.isPasswordCorrect === true) {
      disptach(login({ token: token }));
      success();
      setTimeout(() => {
        navigate("/");
      }, [1000]);
    } else if (
      res &&
      !(res.isValidUser === true && res.isPasswordCorrect === true)
    ) {
      failure();
      setLoading(false);
    }
  }

  const onFinish = (values) => {
    setLoading(true);
    JS2Py.PythonFunctions.SessionServer.getNewSessionId(function (res) {
      setToken(res);
      console.log(res);
      console.log(token);
      JS2Py.PythonFunctions.SessionServer.validateLogin(
        res, // session id
        values.username,
        values.password,
        values.remember,
        "https://app.talk-motion.com/login", // login url
        "https://app.talk-motion.com", // after login url
        function (res) {
          handleLogin(res);
        }
      );
    });
  };

  return { onFinish, loading, contextHolder };
}

export default useLogin;
