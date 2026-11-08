import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "../app/features/loginSlice";
import { setUser } from "../app/features/userSlice";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
// eslint-disable-next-line
import regeneratorRuntime from "regenerator-runtime";

function useAuthStatus() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [token] = useLocalStorage("token");

  const dispatch = useDispatch();
  const loggedIn = useSelector((state) => state.login.isLoggedIn);
  const serverConnected = useSelector((state) => state.server.serverConnected);
  const wasConnected = useRef(serverConnected);

  function isLoggedIn() {
    // Without the RemotePy socket there is no RemotePy session to check. Resolve now and
    // re-check when the socket connects, instead of waiting on a callback that never fires.
    if (!serverConnected) {
      setCheckingStatus(false);
      return;
    }
    try {

        JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted(token, function() {
          // HERE: enable login button. this is only after session starts
          // update status that session started
        });

      JS2Py.PythonFunctions.SessionServer.isLoggedIn(token, function (res) {
        if (res?.isLoggedIn === true) {
          dispatch(login({ token: token }));
          dispatch(
            setUser({ username: res.user.username, name: res.user.first })
          );
        } else if (res?.isLoggedIn === false) {
          dispatch(logout());
        }
        setCheckingStatus(false);
      });
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    // The socket just came up after we had resolved without it: check again before any
    // guard decides to redirect.
    if (serverConnected && !wasConnected.current) setCheckingStatus(true);
    wasConnected.current = serverConnected;
    isLoggedIn();
  }, [window.location.pathname, serverConnected]);

  return { loggedIn, checkingStatus };
}

export default useAuthStatus;
