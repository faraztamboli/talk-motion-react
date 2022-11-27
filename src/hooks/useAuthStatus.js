import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "../app/features/loginSlice";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
import regeneratorRuntime from "regenerator-runtime";

function useAuthStatus() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [token] = useLocalStorage("token");

  const dispatch = useDispatch();
  const loggedIn = useSelector((state) => state.login.isLoggedIn);

  const isLoggedIn = async (token) => {
    try {
      console.log(token);

      JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted(
        token,
        (res) => console.log(res)
      );

      await JS2Py.PythonFunctions.SessionServer.isLoggedIn(token, (res) => {
        console.log(res);
        if (res.isLoggedIn === true) {
          dispatch(login({ token: token, user: "admin" }));
        } else if (res.isLoggedIn === false) {
          dispatch(logout());
        }
        setCheckingStatus(false);
      });
    } catch (err) {
      // console.log(err);
    }
  };

  useEffect(() => {
    isLoggedIn(token);
  }, [token]);

  // useEffect(() => {
  //   // const sessionId = getSessionId();
  //   // const isLoggedIn = async () => {
  //   isLoggedIn(token);
  //   // };
  //   // isLoggedIn();
  //   //eslint-disable-next-line
  // }, [loggedIn]);

  return { loggedIn, checkingStatus };
}

export default useAuthStatus;
