import React from "react";
import { Col, Row } from "antd";
import Cart from "../components/ui/Cart";
import PaymentForm from "../components/ui/PaymentForm";

function Payment() {
  return (
    <>
      <div className="purchase-model-list ">
        <Row>
          <Col span={12} xs={24} lg={12} className="payment-first-col">
            <Cart />
          </Col>
          <Col span={12} xs={24} lg={12} className="payment-second-col">
            <PaymentForm />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Payment;
