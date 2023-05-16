import React from "react";
import { Col, Row } from "antd";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import PaymentForm from "../components/PaymentForm";

function Payment(props) {
  return (
    <>
      <Header md={props.md} />
      <div className="purchase-model-list">
        <Row>
          <Col span={12} xs={24} lg={12} className="payment-first-col">
            <Cart />
          </Col>
          <Col span={12} xs={24} lg={12} className="payment-second-col">
            <PaymentForm />
          </Col>
        </Row>
      </div>
      <Footer />
    </>
  );
}

export default Payment;
