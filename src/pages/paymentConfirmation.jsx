import React, { useEffect } from "react";
import { Col, Divider, Row, Button, Space } from "antd";
import {
  AppstoreOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import checked from "../media/images/checked.png";
import cancel from "../media/images/cancel.png";
import { useNavigate } from "react-router-dom";

import { confirmPurchase } from "../hooks/usePayment/confirmPurchase";

const paymentConfirmation = () => {
  const navigate = useNavigate();

  useEffect(() => {}, []);

  return (
    <div className="successful-page">
      <div className="container">
        <Row
          className="min-height-100vh"
          justify="center"
          align="middle"
        >
          <Col align="middle">
            {true ? (
              <>
                <img
                  src={checked}
                  alt={"checked"}
                  className="checked-icon"
                />
                <h1>Payment Successfull!</h1>
              </>
            ) : (
              <>
                <img
                  src={cancel}
                  alt={"cancel"}
                  className="cancel-icon"
                />
                <h1>Payment Failed!</h1>
                <p>
                  Please try again in a few minutes or{" "}
                  <a href="/" target="_blank">
                    contact support.
                  </a>
                </p>
              </>
            )}
            <Space className="buttons">
              <Button
                type="primary"
                onClick={(e) => navigate("/models")}
              >
                <AppstoreAddOutlined />
                Store{" "}
              </Button>
              <Button
                type="primary"
                onClick={(e) => navigate("/my-models")}
              >
                <AppstoreOutlined />
                My Models
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default paymentConfirmation;
