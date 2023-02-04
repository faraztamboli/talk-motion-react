import React from "react";
import { Col, Form, Row, Input, Button } from "antd";
import { MdCreditCard, MdLock } from "react-icons/md";

function PaymentForm() {
  return (
    <div className="payment-container">
      <div className="payment-details">
        <Form id="payment-form">
          <h2>Check-out</h2>
          <p>Payee Details</p>
          <Row className="payment-form-row">
            <Col span={11} xs={24} md={11}>
              <Form.Item>
                <Input
                  className="payment-form-inputs"
                  type="text"
                  size="large"
                  placeholder="First Name"
                />
              </Form.Item>
            </Col>
            <Col span={11} xs={24} md={11}>
              <Form.Item>
                <Input
                  className="payment-form-inputs"
                  type="text"
                  size="large"
                  placeholder="Last Name"
                />
              </Form.Item>
            </Col>
          </Row>

          <p>Payment Details</p>
          <Form.Item>
            <Input
              className="payment-form-inputs"
              type="text"
              size="large"
              placeholder="Card Number"
              prefix={<MdCreditCard size={24} className="payment-form-icons" />}
            />
          </Form.Item>

          <Row className="payment-form-row">
            <Col span={11} xs={24} md={11}>
              <Form.Item>
                <Input
                  className="payment-form-inputs"
                  type="text"
                  size="large"
                  placeholder="CVV"
                  prefix={<MdLock size={24} className="payment-form-icons" />}
                />
              </Form.Item>
            </Col>
            <Col span={11} xs={24} md={11}>
              <Form.Item>
                <Input
                  className="payment-form-inputs"
                  type="text"
                  size="large"
                  placeholder="Expire Date"
                />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            block
            size="large"
            className="payment-form-btn"
          >
            Pay $299.97
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default PaymentForm;
