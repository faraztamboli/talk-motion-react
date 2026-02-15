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
    // Get WebSocket URL from environment variable or use default
    const wsUrl = import.meta.env.VITE_WS_SERVER_URL || "wss://app.talk-motion.com:8083";
    JS2Py.serverName = wsUrl;

    let retryCount = 0;
    let maxRetries = 5;
    let retryTimeoutId = null;
    let isUnmounted = false;

    const connectWithRetry = () => {
      if (isUnmounted) return;

      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // Exponential backoff, max 30s
        dispatch(setServerStatus(`Retrying connection (${retryCount}/${maxRetries})...`));
        console.log(`Retrying WebSocket connection in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
        
        retryTimeoutId = setTimeout(() => {
          if (!isUnmounted) {
            JS2Py.connect();
          }
        }, delay);
        return;
      }

      dispatch(setServerStatus("Connecting..."));
      JS2Py.connect();
    };

    JS2Py.onopen = function () {
      retryCount = 0; // Reset retry count on successful connection
      dispatch(setServerConnected(true));
      dispatch(setServerStatus("Connected"));
      console.log("WebSocket connected successfully");
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

    JS2Py.onclose = function (event) {
      dispatch(setServerConnected(false));
      
      // Only retry if not a normal closure and we haven't exceeded max retries
      if (event.code !== 1000 && retryCount < maxRetries && !isUnmounted) {
        retryCount++;
        console.warn(`WebSocket closed unexpectedly (code: ${event.code}, reason: ${event.reason || 'none'})`);
        connectWithRetry();
      } else if (retryCount >= maxRetries) {
        dispatch(setServerStatus("Connection failed. Please refresh the page."));
        console.error("WebSocket connection failed after maximum retries");
      } else {
        dispatch(setServerStatus("Disconnected"));
        console.log("WebSocket connection closed");
      }
    };

    JS2Py.onerror = function (event) {
      console.error("WebSocket error occurred:", event);
      dispatch(setServerConnected(false));
      
      // WebSocket onerror doesn't provide detailed error info, but we can check the socket state
      let errorMessage = "Connection error";
      if (JS2Py.socket) {
        const state = JS2Py.socket.readyState;
        if (state === WebSocket.CLOSED) {
          errorMessage = "Connection closed unexpectedly";
        } else if (state === WebSocket.CONNECTING) {
          errorMessage = "Connection timeout";
        }
      }
      
      // Check browser console for certificate errors (they appear as network errors)
      // The actual error details are logged to console by the browser
      dispatch(setServerStatus(`Error: ${errorMessage}`));
      
      // Retry connection if we haven't exceeded max retries
      if (retryCount < maxRetries && !isUnmounted) {
        retryCount++;
        connectWithRetry();
      } else if (retryCount >= maxRetries) {
        dispatch(setServerStatus("Connection failed. Please refresh the page."));
      }
    };

    // Starting connection
    connectWithRetry();

    // Cleanup function
    return () => {
      isUnmounted = true;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      if (JS2Py.socket) {
        const socket = JS2Py.socket;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'Component unmounted');
        }
      }
    };
    //eslint-disable-next-line
  }, []);
}

export default useServerConnection;
