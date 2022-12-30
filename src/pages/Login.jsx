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

  const iconStyle = { marginRight: "10px", color: "#B5B5B5" };
  const formInputStyle = {
    outline: "none",
    border: "2px solid #EEEEEE",
    borderRadius: "33px",
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
                      message: "Please input your Password!",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <LockOutlined
                        className="site-form-item-icon"
                        style={iconStyle}
                      />
                    }
                    type="password"
                    autoComplete="password"
                    placeholder="Password"
                    size="large"
                    style={formInputStyle}
                  />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      shape="round"
                      style={{ width: "100%" }}
                      loading={loading}
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
                    className="login-form-forgot"
                    to="/forgetpassword"
                    style={{
                      fontSize: "14px",
                      lineHeight: "16px",
                      color: "#979797",
                    }}
                  >
                    Forgot password?
                  </Link>
                </Form.Item>
                <Form.Item>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: "16px",
                      color: "#979797",
                    }}
                  >
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
