import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

function ServerError() {
  const navigate = useNavigate();
  return (
    <>
      <div className="mh-100vh flex flex-center-center">
        <Result
          status="500"
          title="500"
          subTitle="Unable to connect to server"
          extra={
            <Button
              className="converter-btns"
              type="primary"
              onClick={() => navigate(0)}
            >
              Reconnect
            </Button>
          }
        />
      </div>
    </>
  );
}

export default ServerError;
