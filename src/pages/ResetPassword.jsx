import React from "react";
import { Layout, Row, Col, Button, Input, Form, Space } from "antd";
import { LockFilled, MailFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import AuthPagesCol from "../components/ui/AuthPagesCol";
import MetaDecorator from "../components/MetaDecorator";
import { signupDetails } from "../data/PageDetails";
import useResetPassword from "../hooks/useResetPassword";

const ResetPassword = (props) => {
  const [form] = Form.useForm();
  const { onFinish, contextHolder, loading } = useResetPassword();

  const formInputStyle = {
    outline: "none",
    border: "2px solid #EEEEEE",
    borderRadius: "33px",
  };

  const formIconStyle = { marginRight: "10px", color: "#B5B5B5" };

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
                <p className="auth-pages-second-col-para">Reset Password</p>
                <Form
                  form={form}
                  name="register"
                  size="large"
                  onFinish={onFinish}
                  scrollToFirstError
                >
                  <Form.Item
                    name="resetpasswordcode"
                    rules={[
                      {
                        required: true,
                        message: "Please input your reset password code",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <MailFilled
                          className="site-form-item-icon"
                          style={formIconStyle}
                        />
                      }
                      placeholder="Reset Password Code"
                      type="text"
                      size="large"
                      style={formInputStyle}
                    />
                  </Form.Item>

                  <Form.Item
                    name="newpassword"
                    rules={[
                      {
                        required: true,
                        message: "Please input your new password",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={formIconStyle}
                        />
                      }
                      placeholder="New Password"
                      size="large"
                      type="password"
                      style={formInputStyle}
                    />
                  </Form.Item>

                  <Form.Item
                    name="repeatnewpassword"
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your new password",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <LockFilled
                          className="site-form-item-icon"
                          style={formIconStyle}
                        />
                      }
                      placeholder="confirm new password"
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
                        Reset Password
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

export default ResetPassword;
