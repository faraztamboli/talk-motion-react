import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Button, Input, Form } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux/es/exports';

const Signup = props => {
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  // const navigate = useNavigate();
  // const disptach = useDispatch();

  const onFinish = values => {
    console.log(values);
  };
  useEffect(() => {
    forceUpdate({});
  }, []);

  return (
    <Layout>
      <Row className="mh-100vh ">
        <Col span={12} className="mh-100vh" style={{ background: '#02086b' }}>
          <div className="text-center mh-100vh p-8 flex flex-left-center">
            <div className="block">
              <h1 className="mb-0 text-white">Talk Motion</h1>
              <p className="text-white">An AI-based Sign Language Translator</p>
              <Button type="primary" className="mt-4">
                Read More
              </Button>
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div className="text-center mh-100vh p-8 flex flex-left-center">
            <div className="block">
              <h1>Hello Again!</h1>
              <p>Register yourself for Talk Motion</p>
              <Form
                name="normal_login"
                className="login-form"
                initialValues={{
                  remember: true,
                }}
                onFinish={onFinish}
              >
                <Form.Item
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your name!',
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Name"
                  />
                </Form.Item>
                <Form.Item
                  name="user_name"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your Username!',
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Username"
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your email',
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Email"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your Password!',
                    },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                  />
                </Form.Item>
                <Form.Item
                  name="confirm_password"
                  rules={[
                    {
                      required: true,
                      message: 'Please cofirm your Password',
                    },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="ConfirmPassword"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="login-form-button block w-100"
                  >
                    Signup
                  </Button>
                  Already have an account? <Link to="/login">Login</Link>
                </Form.Item>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default Signup;
