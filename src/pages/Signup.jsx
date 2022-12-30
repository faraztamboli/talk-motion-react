import React from "react";
import { Layout, Row, Col, Button, Input, Form, Space } from "antd";
import { LockFilled, UserOutlined, MailFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useSignup from "../hooks/useSignup";
import AuthPagesCol from "../components/ui/AuthPagesCol";
import MetaDecorator from "../components/MetaDecorator";
import { signupDetails } from "../data/PageDetails";

const Signup = (props) => {
  const [form] = Form.useForm();
  const { onFinish, contextHolder, loading } = useSignup();

  const iconStyle = { marginRight: "10px", color: "#B5B5B5" };
  const formInputStyle = {
    outline: "none",
    border: "2px solid #EEEEEE",
    borderRadius: "33px",
  };

  const { title, description } = signupDetails;

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
                <h1 className="auth-pages-second-col-heading">Hello Again!</h1>
                <p className="auth-pages-second-col-para">
                  Register yourself for Talk Motion
                </p>
                <Form
                  form={form}
                  name="register"
                  size="large"
                  onFinish={onFinish}
                  scrollToFirstError
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

                  <Form.Item
                    name="username"
                    rules={[
                      {
                        required: true,
                        message: "Please input your Username!",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <UserOutlined
                          className="site-form-item-icon"
                          style={iconStyle}
                        />
                      }
                      placeholder="Username"
                      size="large"
                      style={formInputStyle}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your Password",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={iconStyle}
                        />
                      }
                      placeholder="password"
                      size="large"
                      type="password"
                      style={formInputStyle}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your Password",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={iconStyle}
                        />
                      }
                      placeholder="confirm password"
                      size="large"
                      type="password"
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
                        Sign Up
                      </Button>
                    </Space>
                  </Form.Item>

                  <Form.Item>
                    <p className="auth-form-links">
                      Already have an account? <Link to="/login">Login</Link>
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

export default Signup;
