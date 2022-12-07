import React from "react";
import { Col, Form, Row, Input, Button } from "antd";
import { MdCreditCard, MdLock } from "react-icons/md";
import modelImg from "../media/images/model.png";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Payment(props) {
  return (
    <>
      <Header md={props.md} />
      <div className="purchase-model-list">
        <Row>
          <Col span={12} className="payment-first-col">
            <div className="container">
              <h2>Your Cart</h2>
              <div className="purchase-model-list-item">
                <div className="purchase-model-list-item-content">
                  <div className="model-logo">
                    <img src={modelImg} alt="model" />
                  </div>
                  <div>
                    <h3>Model 1 Title</h3>
                    <p>lorem ipsum dolor sit amet</p>
                  </div>
                </div>
                <div className="purchase-model-list-item-price">
                  <p>$99.99</p>
                </div>
              </div>

              <div className="purchase-model-list-item">
                <div className="purchase-model-list-item-content">
                  <div className="model-logo">
                    <img src={modelImg} alt="model" />
                  </div>
                  <div>
                    <h3>Model 1 Title</h3>
                    <p>lorem ipsum dolor sit amet</p>
                  </div>
                </div>
                <div className="purchase-model-list-item-price">
                  <p>$99.99</p>
                </div>
              </div>

              <div className="purchase-model-list-item">
                <div className="purchase-model-list-item-content">
                  <div className="model-logo">
                    <img src={modelImg} alt="model" />
                  </div>
                  <div>
                    <h3>Model 1 Title</h3>
                    <p>lorem ipsum dolor sit amet</p>
                  </div>
                </div>
                <div className="purchase-model-list-item-price">
                  <p>$99.99</p>
                </div>
              </div>

              <div className="total">
                <h2>Sub-total:</h2>
                <p>$299.97</p>
              </div>
            </div>
          </Col>

          <Col span={12} className="payment-second-col">
            <div className="container">
              <div className="payment-details">
                <h2>Check-out</h2>
                <p>Payee Details</p>

                <Form>
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
                      prefix={
                        <MdCreditCard
                          size={24}
                          className="payment-form-icons"
                        />
                      }
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
                          prefix={
                            <MdLock size={24} className="payment-form-icons" />
                          }
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
                </Form>

                <Button
                  type="primary"
                  block
                  size="large"
                  className="payment-form-btn"
                >
                  Pay $299.97
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Footer />
    </>
  );
}

export default Payment;
