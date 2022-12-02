import React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const Statuses = (props) => {
  const location = useLocation();
  const { serverConnected, serverStatus } = useSelector(
    (state) => state.server
  );

  useEffect(() => {
    // console.log(serverConnected);
  }, [serverConnected]);

  return (
    <div className="statuses">
      <div className={`conn-status`}>
        <p
          style={props.collapsedWidth === 0 ? { fontSize: ".6rem" } : null}
          className={
            serverConnected
              ? "statuses-success converter-btns"
              : "danger converter-btns"
          }
        >
          Server {serverStatus}
        </p>
      </div>
      {(location.pathname === "/trainer" ||
        location.pathname === "/converter") && (
        <div className="device-status">
          <p
            style={props.collapsedWidth === 0 ? { fontSize: ".6rem" } : null}
            className="warning converter-btns"
          >
            Device Connecting...
          </p>
        </div>
      )}
    </div>
  );
};
