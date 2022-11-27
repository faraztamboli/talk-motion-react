import React from "react";
import { Layout, Row, Col, Button, Form, Input, Checkbox } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useLogin from "./useLogin";

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
        <Col
          span={12}
          xs={24}
          md={12}
          className="mh-100vh auth-pages-bg"
          // style={{ background: "#02086B", backdropFilter: "blur(59.5px)" }}
        >
          <div className="text-center mh-100vh p-8 flex flex-left-center">
            <div className="block">
              <h1 className="mb-0 text-white">Talk Motion</h1>
              <p className="text-white">An AI-based Sign Language Translator</p>
              <Button type="default" shape="round" className="mt-4">
                Read More
              </Button>
            </div>
          </div>
        </Col>
        <Col span={12} xs={24} md={12}>
          <div className="text-center mh-100vh p-8 flex flex-left-center">
            <div className="block">
              <h1>Hello Again!</h1>
              <p>Login for Talk Motion</p>
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
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Username"
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
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    autoComplete="password"
                    placeholder="Password"
                  />
                </Form.Item>
                <Form.Item>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    shape="round"
                    className="login-form-button block w-100"
                    loading={loading}
                  >
                    Log in
                  </Button>
                </Form.Item>
                <Form.Item>
                  <Link className="login-form-forgot" to="/forgetpassword">
                    Forgot password
                  </Link>
                </Form.Item>
                <Form.Item>
                  <p>
                    Don't have an account{" "}
                    <Link to="/signup">Register now!</Link>
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
