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
  const { onFinish } = useSignup();

  const { title, description } = signupDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Layout>
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
                  initialValues={{
                    residence: ["zhejiang", "hangzhou", "xihu"],
                    prefix: "86",
                  }}
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
                          style={{ marginRight: "10px", color: "#B5B5B5" }}
                        />
                      }
                      placeholder="Username"
                      size="large"
                      style={{
                        outline: "none",
                        border: "2px solid #EEEEEE",
                        borderRadius: "33px",
                      }}
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
                          style={{ marginRight: "10px", color: "#B5B5B5" }}
                        />
                      }
                      placeholder="password"
                      size="large"
                      type="password"
                      // autoComplete="password"
                      style={{
                        outline: "none",
                        border: "2px solid #EEEEEE",
                        borderRadius: "33px",
                      }}
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
                          style={{ marginRight: "10px", color: "#B5B5B5" }}
                        />
                      }
                      placeholder="confirm password"
                      size="large"
                      type="password"
                      // autoComplete="password"
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
                        // className="login-form-button block w-100"
                        style={{ width: "100%" }}
                        // loading={loading}
                        // block={true}
                      >
                        Sign Up
                      </Button>
                    </Space>
                  </Form.Item>

                  <Form.Item>
                    <p>
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
