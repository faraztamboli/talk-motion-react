import React from "react";
import JS2Py from "../remotepyjs";
import { useDispatch } from "react-redux";
// import { JS2PyConnect } from "../data/JS2PyConnectFunctions/JS2PyConnect";
import {
  setServerConnected,
  setServerStatus,
} from "../app/features/serverSlice";

async function useConnectToServer() {
  const dispatch = useDispatch();

  return React.useEffect(() => {
    let conn = null;
    JS2Py.serverName = "wss://talk-motion.com:8083";

    JS2Py.onopen = function () {
      dispatch(setServerConnected(true)),
        dispatch(setServerStatus("Connected"));
      console.log("inside hook connected");
    };

    JS2Py.onclose = function () {
      dispatch(setServerConnected(false));
      dispatch(setServerStatus("Disconnected"));
    };

    // JS2Py.subOnClose(() => {
    //   dispatch(setServerConnected(false));
    //   dispatch(setServerStatus("Disconnected"));
    // });

    // starting connection and taking instance to close on unmounts
    conn = JS2Py.start();

    // stop server when component unmounts
    return () => {
      conn.close(1000, "Rerendered close!");
    };
    //eslint-disable-next-line
  }, []);
}

export default useConnectToServer;
