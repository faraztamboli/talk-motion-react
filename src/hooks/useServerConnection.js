import React from "react";
import JS2Py from "../remotepyjs";
import { useDispatch } from "react-redux";
import {
  setServerConnected,
  setServerStatus,
} from "../app/features/serverSlice";
import { setProfileImg } from "../app/features/userSlice";
import useProfile from "./useProfile";

async function useServerConnection() {
  const { getUserProfile } = useProfile();
  const dispatch = useDispatch();

  return React.useEffect(() => {
    let conn = null;
    JS2Py.serverName = "wss://app.talk-motion.com:8083";

    JS2Py.onopen = function () {
      dispatch(setServerConnected(true));
      dispatch(setServerStatus("Connected"));
//      setTimeout(() => {
//        getUserProfile()
//          .then((res) => {
//            console.log('on result of: getUserProfile');
//            console.log(res);
//            dispatch(setProfileImg(res.sm_img));
//          })
//          .catch((err) => console.log(err));
//      }, 2000);
    };

    JS2Py.onclose = function () {
      dispatch(setServerConnected(false));
      dispatch(setServerStatus("Disconnected"));
    };

    // starting connection and taking instance to close on unmounts
    conn = JS2Py.start();
    console.log(conn.readyState);

    // stop server when component unmounts
    return () => {
      console.log(conn.readyState);
      conn.addEventListener('open', (event) => {
        conn.close(1000, 're-rendered page');
      });
    };
    //eslint-disable-next-line
  }, []);
}

export default useServerConnection;
