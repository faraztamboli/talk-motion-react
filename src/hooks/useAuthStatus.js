import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "../app/features/loginSlice";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
// eslint-disable-next-line
import regeneratorRuntime from "regenerator-runtime";

function useAuthStatus() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [token] = useLocalStorage("token");

  const dispatch = useDispatch();
  const loggedIn = useSelector((state) => state.login.isLoggedIn);

  function isLoggedIn() {
    try {
      JS2Py.PythonFunctions.SessionServer.isLoggedIn(token, function (res) {
        console.log(res);
        if (res?.isLoggedIn === true) {
          dispatch(login({ token: token, user: "admin" }));
        } else if (res?.isLoggedIn === false) {
          dispatch(logout());
        }
        setCheckingStatus(false);
      });
    } catch (err) {
      // console.log(err);
    }
  }

  useEffect(() => {
    isLoggedIn();
  }, [window.location.pathname]);

  return { loggedIn, checkingStatus };
}

export default useAuthStatus;
