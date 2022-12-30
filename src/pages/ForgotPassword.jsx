import React from "react";
import { Layout, Row, Col, Button, Form, Input, Space } from "antd";
import { MailFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import AuthPagesCol from "../components/ui/AuthPagesCol";
import useForgotPassword from "../hooks/useForgotPassword";
import MetaDecorator from "../components/MetaDecorator";
import { forgotPasswordDetails } from "../data/PageDetails";

const ForgotPassword = (props) => {
  const { onFinish, contextHolder, loading } = useForgotPassword();

  const iconStyle = { marginRight: "10px", color: "#B5B5B5" };
  const formInputStyle = {
    outline: "none",
    border: "2px solid #EEEEEE",
    borderRadius: "33px",
  };

  const { title, description } = forgotPasswordDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
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
            <div className="text-center mh-100vh p-8 flex flex-center-center auth-pages-second-col">
              <div className="block">
                <h1 className="auth-pages-second-col-heading">
                  Forgot Password?
                </h1>
                <p className="auth-pages-second-col-para">
                  Don&apos;t worry, it happens to the best of us!
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
                          style={iconStyle}
                        />
                      }
                      placeholder="Email"
                      type="email"
                      size="large"
                      style={formInputStyle}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space direction="vertical" className="w-100p">
                      <Button
                        type="primary"
                        htmlType="submit"
                        shape="round"
                        size="large"
                        className="w-100p"
                        loading={loading}
                      >
                        Send Link
                      </Button>
                    </Space>
                  </Form.Item>
                  <Form.Item>
                    <p className="auth-form-links">
                      Continue to <Link to="/login">Login</Link>
                    </p>
                  </Form.Item>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Layout>
    </>
  );
};

export default ForgotPassword;
