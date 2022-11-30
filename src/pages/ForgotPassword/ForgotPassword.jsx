import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Button, Form, Input, Space, message } from "antd";
import { MailFilled } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux/es/exports";
import { login } from "../../app/features/loginSlice";
import AuthPagesCol from "../../components/ui/AuthPagesCol";
import forgotPasswordLogic from "./forgotPasswordLogic";

const ForgotPassword = (props) => {
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Link sent to your email",
    });
  };

  const failure = () => {
    messageApi.open({
      type: "error",
      content: "Cannot reset the password",
    });
  };

  const { onFinish, isMailSent } = forgotPasswordLogic();

  return (
    <Layout>
      {contextHolder}
      <Row
        className="mh-100vh"
        style={
          props.md === true
            ? { display: "flex", flexDirection: "column-reverse" }
            : null
        }
      >
        <AuthPagesCol />
        <Col span={12} xs={24} md={12}>
          <div className="text-center mh-100vh p-8 flex flex-left-center auth-pages-second-col">
            <div className="block">
              <h1 className="auth-pages-second-col-heading">
                Forgot Password?
              </h1>
              <p className="auth-pages-second-col-para">
                Don't worry, it happens to the best of us!
              </p>
              <Form
                name="normal_login"
                className="login-form"
                size="large"
                initialValues={{
                  remember: true,
                }}
                onFinish={onFinish}
              >
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Email",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <MailFilled
                        className="site-form-item-icon"
                        style={{ marginRight: "10px", color: "#B5B5B5" }}
                      />
                    }
                    placeholder="Email"
                    type="email"
                    size="large"
                    style={{
                      outline: "none",
                      border: "2px solid #EEEEEE",
                      borderRadius: "33px",
                    }}
                  />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      shape="round"
                      size="large"
                      style={{ width: "100%" }}
                      onClick={isMailSent === true ? success : failure}
                      // loading={loading}
                    >
                      Send Link
                    </Button>
                  </Space>
                </Form.Item>
                <Form.Item>
                  <p>
                    Continue to <Link to="/login">Login</Link>
                  </p>
                </Form.Item>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default ForgotPassword;
