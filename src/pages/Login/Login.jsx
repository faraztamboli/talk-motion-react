import React from "react";
import { Layout, Space, Row, Col, Button, Form, Input, Checkbox } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useLogin from "./useLogin";
import AuthPagesCol from "../../components/ui/AuthPagesCol";

const Login = (props) => {
  const { onFinish, loginError, loading } = useLogin();

  return (
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
          <div className="text-center mh-100vh p-8 flex flex-left-center auth-pages-second-col">
            <div className="block">
              <h1 className="auth-pages-second-col-heading">Hello Again!</h1>
              <p className="auth-pages-second-col-para">
                Login for Talk Motion
              </p>
              {loginError && (
                <p /* style={{ color: "red" }} */>
                  Invalid username or password
                </p>
              )}
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
                      message: "Please input your Password!",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <LockOutlined
                        className="site-form-item-icon"
                        style={{ marginRight: "10px", color: "#B5B5B5" }}
                      />
                    }
                    type="password"
                    autoComplete="password"
                    placeholder="Password"
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
                      // className="login-form-button block w-100"
                      style={{ width: "100%" }}
                      loading={loading}
                      // block={true}
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
                    Don`&apos;`t have an account{" "}
                    <Link to="/signup">Sign-up</Link>
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
