import React from "react";
import { Layout, Space, Row, Col, Button, Form, Input, Checkbox } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useLogin from "../hooks/useLogin";
import AuthPagesCol from "../components/ui/AuthPagesCol";
import MetaDecorator from "../components/MetaDecorator";
import { loginDetails } from "../data/PageDetails";

const Login = (props) => {
  const { onFinish, loading, contextHolder } = useLogin();
  const { title, description } = loginDetails;

  const iconStyle = { 
    marginRight: "10px", 
    color: "var(--color-neutral-400)" 
  };
  const formInputStyle = {
    outline: "none",
    border: "2px solid var(--color-neutral-200)",
    borderRadius: "var(--radius-pill)",
    transition: "all var(--transition-base)",
  };

  return (
    <Layout>
      <MetaDecorator title={title} description={description} />
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
                Login for Talk Motion
              </p>
              <Form
                name="normal_login"
                className="login-form"
                initialValues={{
                  remember: true,
                }}
                size="large"
                onFinish={onFinish}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Username!",
                    },
                  ]}
                >
                    <Input
                      id="login-username"
                      prefix={
                        <UserOutlined
                          className="site-form-item-icon"
                          style={iconStyle}
                          aria-hidden="true"
                        />
                      }
                      placeholder="Username"
                      size="large"
                      style={formInputStyle}
                      aria-label="Username"
                      aria-required="true"
                      onFocus={(e) => {
                        e.target.style.borderColor = "var(--color-primary)";
                        e.target.style.boxShadow = "0 0 0 2px var(--color-primary-light)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--color-neutral-200)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Password!",
                    },
                  ]}
                >
                    <Input
                      id="login-password"
                      prefix={
                        <LockOutlined
                          className="site-form-item-icon"
                          style={iconStyle}
                          aria-hidden="true"
                        />
                      }
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      size="large"
                      style={formInputStyle}
                      aria-label="Password"
                      aria-required="true"
                      onFocus={(e) => {
                        e.target.style.borderColor = "var(--color-primary)";
                        e.target.style.boxShadow = "0 0 0 2px var(--color-primary-light)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--color-neutral-200)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" className="w-100p">
                    <Button
                      type="primary"
                      htmlType="submit"
                      shape="round"
                      className="w-100p"
                      loading={loading}
                      size="large"
                      style={{
                        height: "44px",
                        fontWeight: 600,
                        fontSize: "16px",
                        boxShadow: "0 2px 8px rgba(22, 119, 255, 0.3)",
                        transition: "all var(--transition-base)"
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 119, 255, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(22, 119, 255, 0.3)";
                      }}
                    >
                      Log in
                    </Button>
                  </Space>
                </Form.Item>

                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Form.Item noStyle>
                  <Link
                    className="login-form-forgot auth-form-links"
                    to="/forgetpassword"
                  >
                    Forgot password?
                  </Link>
                </Form.Item>
                <Form.Item>
                  <p className="auth-form-links">
                    Don&apos;t have an account <Link to="/signup">Sign-up</Link>
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

export default Login;
