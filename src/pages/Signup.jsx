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
  
  const handleInputFocus = (e) => {
    e.target.style.borderColor = "var(--color-primary)";
    e.target.style.boxShadow = "0 0 0 2px var(--color-primary-light)";
  };
  
  const handleInputBlur = (e) => {
    e.target.style.borderColor = "var(--color-neutral-200)";
    e.target.style.boxShadow = "none";
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
                    label="Email"
                    rules={[
                      {
                        required: true,
                        message: "Please input your Email",
                      },
                      {
                        type: "email",
                        message: "Please enter a valid email address",
                      },
                    ]}
                  >
                    <Input
                      id="signup-email"
                      prefix={
                        <MailFilled
                          className="site-form-item-icon"
                          style={iconStyle}
                          aria-hidden="true"
                        />
                      }
                      placeholder="Email"
                      type="email"
                      size="large"
                      style={formInputStyle}
                      aria-label="Email address"
                      aria-required="true"
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </Form.Item>

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
                      id="signup-username"
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
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your Password",
                      },
                    ]}
                  >
                    <Input
                      id="signup-password"
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={iconStyle}
                          aria-hidden="true"
                        />
                      }
                      placeholder="Password"
                      size="large"
                      type="password"
                      autoComplete="new-password"
                      style={formInputStyle}
                      aria-label="Password"
                      aria-required="true"
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm password"
                    label="Confirm Password"
                    dependencies={['password']}
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your Password",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input
                      id="signup-confirm-password"
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={iconStyle}
                          aria-hidden="true"
                        />
                      }
                      placeholder="Confirm password"
                      size="large"
                      type="password"
                      autoComplete="new-password"
                      style={formInputStyle}
                      aria-label="Confirm password"
                      aria-required="true"
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
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
