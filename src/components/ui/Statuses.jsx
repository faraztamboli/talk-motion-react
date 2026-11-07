import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { isRemotePyOptionalPath } from "../../config/layoutConfig";

export const Statuses = (props) => {
  const location = useLocation();

  const { serverConnected, serverStatus } = useSelector(
    (state) => state.server
  );
  const { status, statusText } = useSelector((state) => state.trainer);
  // Conversation Mode doesn't use the RemotePy socket, so its status would only mislead.
  const showServerStatus = !isRemotePyOptionalPath(location.pathname);

  return (
    <div className="statuses">
      {showServerStatus && (
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
      )}
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
