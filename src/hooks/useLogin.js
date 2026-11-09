import { useState } from "react";
import JS2Py from "../remotepyjs";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../app/features/loginSlice";
import useLocalStorage from "./useLocalStorage";
import useApiAuth from "./useApiAuth";
import { getAccessToken } from "../api/http";
import {
  API_LOGIN_WAIT_MS,
  isRemotePyLoginOk,
  loginDestination,
  settleWithin,
  signInToRemotePy,
} from "../api/remotepyLogin";
import { readLocalOverrides, resolveFlags } from "../config/flags";

/** Conversation Mode is on for this API login (server flags, plus dev overrides). */
const wantsConversation = (api) =>
  Boolean(api?.ok) && resolveFlags({ server: api.flags, overrides: readLocalOverrides() }).conversation_v2;

/** Only same-app paths, never "//host" or a full URL. */
export function safeReturnPath(from) {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return null;
  if (/^\/(login|signup|forgetpassword|resetpassword)(?=$|[/?#])/.test(from)) return null;
  return from;
}

function useLogin() {
  const [loading, setLoading] = useState(false);
  const [, setToken] = useLocalStorage("token", "");
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();
  const location = useLocation();
  const disptach = useDispatch();
  // A guard that sent the visitor here passes the page they wanted; go back there after login.
  const returnTo = safeReturnPath(location.state?.from);
  // The TalkMotion 2.0 API is the sign-in authority. Legacy-linked accounts then sign in to
  // RemotePy with the API token instead of the password; if the API is down, or RemotePy
  // cannot take the token, login behaves exactly as before.
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

  function handleLogin(loginInfo, sessionId, api) {
    const destination = loginDestination(loginInfo, wantsConversation(api));
    if (destination === "dashboard") {
      disptach(login({ token: sessionId }));
      success();
      // Same 1 s pause and dashboard as before. Conversation Mode, when enabled, is one tap
      // away in the sidebar and quick actions; existing users are never pushed into it.
      setTimeout(() => {
        navigate(returnTo || "/", { replace: true });
      }, 1000);
    } else if (destination === "conversation") {
      // RemotePy did not accept the login. An account that exists only in the new API can
      // still use Conversation Mode.
      success();
      navigate("/conversation");
    } else {
      failure();
      setLoading(false);
    }
  }

  const onFinish = (values) => {
    setLoading(true);
    // API login first; a RemotePy session id is fetched meanwhile.
    const apiLogin = loginApi(values.username, values.password);
    const newSessionId = new Promise((resolve) => {
      JS2Py.PythonFunctions.SessionServer.getNewSessionId(resolve);
    }).catch((err) => {
      console.error("RemotePy session unavailable", err);
      return null;
    });
    // A slow API must not hold classic login up for long: past API_LOGIN_WAIT_MS RemotePy
    // gets the password as before, while the API login finishes in the background.
    const apiInTime = settleWithin(apiLogin, API_LOGIN_WAIT_MS, { ok: false, flags: {} });

    Promise.all([newSessionId, apiInTime]).then(async ([sessionId, api]) => {
      let loginInfo = null;
      if (sessionId) {
        setToken(sessionId);
        try {
          ({ loginInfo } = await signInToRemotePy({
            js2py: JS2Py,
            sessionId,
            values,
            api,
            accessToken: api.ok ? getAccessToken() : null,
          }));
        } catch (err) {
          console.error("RemotePy sign-in failed", err);
        }
      }
      // Conversation Mode for API-only accounts needs the API's real answer, however slow.
      handleLogin(loginInfo, sessionId, isRemotePyLoginOk(loginInfo) ? api : await apiLogin);
    });
  };

  return { onFinish, loading, contextHolder };
}

export default useLogin;
