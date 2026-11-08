import { useState } from "react";
import JS2Py from "../remotepyjs";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../app/features/loginSlice";
import useLocalStorage from "./useLocalStorage";
import useApiAuth from "./useApiAuth";
import { readLocalOverrides, resolveFlags } from "../config/flags";

/** Conversation Mode is on for this API login (server flags, plus dev overrides). */
const wantsConversation = (api) =>
  Boolean(api?.ok) && resolveFlags({ server: api.flags, overrides: readLocalOverrides() }).conversation_v2;

function useLogin() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useLocalStorage("token", "");
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();
  const disptach = useDispatch();
  // Sign in to the TalkMotion 2.0 API alongside RemotePy. The API is optional during the
  // migration: if it is down, legacy login behaves exactly as before.
  const { loginApi } = useApiAuth();

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

  function handleLogin(login_info, token_input, apiLogin) {
    console.log(login_info);
    if (login_info && login_info.isValidUser === true && login_info.isPasswordCorrect === true) {
      disptach(login({ token: token_input }));
      success();
      // Same 1 s pause as before. If the API answered by then, honour Conversation Mode.
      let api = null;
      apiLogin.then((result) => {
        api = result;
      });
      setTimeout(() => {
        navigate(wantsConversation(api) ? "/conversation" : "/");
      }, 1000);
    } else if (
      login_info &&
      !(login_info.isValidUser === true && login_info.isPasswordCorrect === true)
    ) {
      // RemotePy rejected the credentials. An account that exists only in the new API can
      // still use Conversation Mode.
      apiLogin.then((api) => {
        if (wantsConversation(api)) {
          success();
          navigate("/conversation");
        } else {
          failure();
          setLoading(false);
        }
      });
    }
  }

  const onFinish = (values) => {
    setLoading(true);
    const apiLogin = loginApi(values.username, values.password);
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
        function (login_info) {
          handleLogin(login_info, res, apiLogin);
        }
      );
    });
  };

  return { onFinish, loading, contextHolder };
}

export default useLogin;
