import React from 'react';
import JS2Py from '../remotepyjs';
import { useDispatch } from 'react-redux';
import { JS2PyConnect } from '../data/JS2PyConnectFunctions/JS2PyConnect';
import { setServerConnected, setServerStatus } from '../app/features/serverSlice';

function connectToServer() {
  const dispatch = useDispatch();

  return React.useEffect(() => {
    let conn = null;
    JS2Py.serverName = 'wss://talk-motion.com:8083';

    // Push function to onopen array of functions
    JS2Py.subOnOpen(() => {
      dispatch(setServerConnected(true));
      dispatch(setServerStatus('Connected'));
    });

    // called JS2PyConnect to get all the functions of JS2Py
    JS2PyConnect();

    JS2Py.subOnClose(() => {
      dispatch(setServerConnected(false));
      dispatch(setServerStatus('Disconnected'));
    });

    // starting connection and taking instance to close on unmounts
    conn = JS2Py.start();

    // stop server when component unmounts
    return () => {
      conn.close(1000, 'Rerendered close!');
    };
    //eslint-disable-next-line
  }, []);
}

export default connectToServer;
