import React from "react";
import { Col, Divider, Row, Button, Space } from "antd";
import {
  AppstoreOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import checked from "../media/images/checked.png";
import { useNavigate } from "react-router-dom";

const PaymentSuccessful = () => {
  const navigate = useNavigate();

  return (
    <div className="successful-page">
      <div className="container">
        <Row
          className="min-height-100vh"
          justify="center"
          align="middle"
        >
          <Col align="middle">
            <img
              src={checked}
              alt={"checked"}
              className="checked-icon"
            />
            <h1>Payment Successfull!</h1>
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

export default PaymentSuccessful;
