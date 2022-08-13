import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const Statuses = () => {
  const location = useLocation();
  const { serverConnected, serverStatus } = useSelector(state => state.server);

  React.useEffect(() => {
    console.log(serverConnected);
  }, [serverConnected]);

  return (
    <div className="statuses">
      <div className={`conn-status`}>
        <p className={serverConnected ? 'success' : 'danger'}>Server {serverStatus}</p>
      </div>
      {(location.pathname === '/trainer' || location.pathname === '/converter') && (
        <div className="device-status">
          <p className="warning">Device Connecting...</p>
        </div>
      )}
    </div>
  );
};
