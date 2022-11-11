import React from 'react';
import { Layout, Row, Col, Button, Input, Form, Checkbox } from 'antd';
import { Link } from 'react-router-dom';
import { formItemLayout, tailFormItemLayout } from '../../data/signupFormLayout';
import { validateCountryName } from '../../data/countries';
import JS2Py from '../../remotepyjs';
import SignupLogic from './SignupLogic';

const Signup = props => {
  const [form] = Form.useForm();
  const { onFinish } = SignupLogic();

  return (
    <Layout>
      <Row
        className="mh-100vh"
        style={props.md === true ? { display: 'flex', flexDirection: 'column-reverse' } : null}
      >
        <Col
          span={12}
          xs={24}
          md={12}
          className="mh-100vh"
          style={{ background: '#02086b', background: '#02086B', backdropFilter: 'blur(59.5px)' }}
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
              <p>Register yourself for Talk Motion</p>
              <Form
                {...formItemLayout}
                form={form}
                name="register"
                onFinish={onFinish}
                initialValues={{
                  residence: ['zhejiang', 'hangzhou', 'xihu'],
                  prefix: '86',
                }}
                scrollToFirstError
              >
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[
                    {
                      type: 'text',
                      message: 'Please enter your name',
                    },
                    {
                      required: true,
                      message: 'Please enter your name',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="E-mail"
                  rules={[
                    {
                      type: 'email',
                      message: 'The input is not valid E-mail!',
                    },
                    {
                      required: true,
                      message: 'Please input your E-mail!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="username"
                  label="User-name"
                  validate="validate"
                  hasFeedback
                  rules={[
                    {
                      type: 'text',
                      message: 'username is already taken',
                    },
                    {
                      required: true,
                      message: 'Please enter a username',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          JS2Py.PythonFunctions.SessionServer.checkIfUsernameExists(
                            getFieldValue('username'),
                            res => {
                              if (!value || res.userAlreadyExists !== true) {
                                resolve();
                              }
                              reject('User already exists');
                            },
                          );
                        });
                      },
                    }),
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input autoComplete="new-username" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your password!',
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label="Confirm Password"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error('The two passwords that you entered do not match!'),
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>

                <Form.Item
                  name="street"
                  label="Street Address"
                  tooltip="What do you want others to call you?"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your street name',
                      whitespace: true,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="city"
                  label="City"
                  tooltip="What do you want others to call you?"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your city name',
                      whitespace: true,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="country"
                  label="Country"
                  tooltip="What do you want others to call you?"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your country name',
                      whitespace: true,
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          if (!value || validateCountryName(getFieldValue('country')) === true) {
                            resolve();
                          } else {
                            reject('Please enter a valid country name');
                          }
                        });
                      },
                    }),
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="agreement"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error('Should accept agreement')),
                    },
                  ]}
                  {...tailFormItemLayout}
                >
                  <Checkbox>
                    I have read the <a href="...">agreement</a>
                  </Checkbox>
                </Form.Item>
                <Form.Item {...tailFormItemLayout}>
                  <Button type="primary" shape="round" htmlType="submit">
                    Register
                  </Button>
                </Form.Item>

                <Form.Item {...tailFormItemLayout}>
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
  );
};

export default Signup;
