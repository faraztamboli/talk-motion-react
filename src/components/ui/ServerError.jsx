import { Button } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

function ServerError() {
  const navigate = useNavigate();
  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2.3rem", color: "#1890ff" }}>
          Unable to connect to Server
        </h2>
        <p
          style={{
            fontSize: "1rem",
            letterSpacing: "1px",
            fontWeight: "500",
            color: "hsl(210deg 8% 45%)",
          }}
        >
          Please check your internet connection or reload the page
        </p>
        <Button
          className="converter-btns"
          type="primary"
          onClick={() => navigate(0)}
        >
          Reconnect
        </Button>
      </div>
    </>
  );
}

export default ServerError;
