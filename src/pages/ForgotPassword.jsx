import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Button, Form, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux/es/exports';
import { login } from '../app/features/loginSlice';

const ForgotPassword = props => {
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const navigate = useNavigate();
  const disptach = useDispatch();

  const onFinish = values => {
    // set multiple values in localStorage
    localStorage.setItem('isLoggedIn', true);
    localStorage.setItem('token', '12345');
    disptach(login({ token: '12345', user: 'admin' }));
    navigate('/');
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
              <p>Reset your password</p>
              <Form
                name="normal_login"
                className="login-form"
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
                      message: 'Please enter your email!',
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Email"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="login-form-button block w-100"
                  >
                    Continue
                  </Button>
                  <br /> Or <Link to="/login">Login</Link>
                </Form.Item>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default ForgotPassword;
