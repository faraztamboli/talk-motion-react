import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const Statuses = (props) => {
  const location = useLocation();

  const { serverConnected, serverStatus } = useSelector(
    (state) => state.server
  );
  const { status, statusText } = useSelector((state) => state.trainer);

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
      {location.pathname === "/trainer/collect" && (
        <div className="device-status">
          <p
            style={props.collapsedWidth === 0 ? { fontSize: ".6rem" } : null}
            className={
              status
                ? "statuses-success converter-btns"
                : "danger converter-btns"
            }
          >
            {statusText}
          </p>
        </div>
      )}
    </div>
  );
};
