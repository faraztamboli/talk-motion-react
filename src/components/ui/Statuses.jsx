import React from 'react';
import JS2Py from '../../custom-script/remotepy.1.0.0.min';

export const Statuses = () => {
  // const [serverConn, setServerConn] = React.useState(false);

  // React.useEffect(() => {
  //   JS2Py.onopen = function (fn) {
  //     setServerConn(true);
  //   };
  //   JS2Py.onclose = function () {
  //     setServerConn(false);
  //   };
  // }, []);

  return (
    <div className="statuses">
      <div className="conn-status">
        <p>Server Connecting...</p>
      </div>
      <div className="device-status">
        <p>Device Connecting...</p>
      </div>
    </div>
  );
};
