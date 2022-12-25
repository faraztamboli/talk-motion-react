import React from "react";
import { Col, Form, Input, Row } from "antd";
import { pageContent } from "../data/appContent";

function ContactUsForm() {
  return (
    <section className="contact-us-form-wrapper">
      <div className="container">
        <div className="contact-us-form-parent-div">
          <div className="contact-us-form">
            {pageContent.contactPageContent}
            <Form>
              <Row className="contact-us-form-first-row">
                <Col span={11} xs={24} md={11}>
                  <Form.Item>
                    <Input
                      type="text"
                      size="large"
                      placeholder="First Name"
                      className="contact-us-form-input"
                    />
                  </Form.Item>
                </Col>
                <Col span={11} xs={24} md={11}>
                  <Form.Item>
                    <Input
                      type="text"
                      size="large"
                      placeholder="Last Name"
                      className="contact-us-form-input"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Input
                  className="contact-us-form-input"
                  type="email"
                  size="large"
                  placeholder="Email Address"
                />
              </Form.Item>

              <Form.Item>
                <Input.TextArea
                  className="contact-us-form-input"
                  size="large"
                  placeholder="Message"
                  style={{ height: 150 }}
                />
              </Form.Item>
              <Form.Item>
                <p className="contact-us-form-small">
                  By sending this you are agreed to our privacy policy
                </p>
              </Form.Item>

              <Row className="contact-us-form-submit-row">
                <Form.Item>
                  <button className="contact-us-form-submit-btn">Submit</button>
                </Form.Item>
              </Row>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactUsForm;
