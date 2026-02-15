import React, { useState } from "react";
import { Form, Input, Button, Card, Row, Col, Select, Upload } from "antd";
import { MailOutlined, UserOutlined, FileTextOutlined, InboxOutlined } from "@ant-design/icons";
import MetaDecorator from "../components/MetaDecorator";
import useContact from "../hooks/useContact";
import useMessageApi from "../hooks/useMessageApi";
import { contactUsDetails } from "../data/PageDetails";

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

export default function ContactUs(props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { addContactUsMessage } = useContact();
  const { contextHolder, showMessage } = useMessageApi();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { name, email, subject, message: messageText, category, attachment } = values;
      
      // Handle file upload if present
      let attachmentFile = null;
      if (attachment && attachment.fileList && attachment.fileList.length > 0) {
        attachmentFile = attachment.fileList[0].originFileObj;
      }

      await addContactUsMessage(
        name,
        email,
        subject,
        messageText,
        category || null,
        attachmentFile
      );

      showMessage("success", "Your message has been sent successfully! We'll get back to you soon.");
      form.resetFields();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showMessage("error", "Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const contactStyle = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  const { title, description } = contactUsDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={contactStyle} className="layout-bg mh-100vh">
        <Row justify="center">
          <Col xs={24} sm={22} md={20} lg={16} xl={12}>
            <Card
              title={
                <div style={{ textAlign: "center" }}>
                  <MailOutlined style={{ fontSize: 32, marginBottom: 8, color: "#1890ff" }} />
                  <h2 style={{ margin: 0 }}>Contact Us</h2>
                  <p style={{ marginTop: 8, color: "#666", fontWeight: "normal" }}>
                    We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                  </p>
                </div>
              }
              style={{ marginTop: 24 }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
              >
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[
                    { required: true, message: "Please enter your name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Your full name"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email address" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="your.email@example.com"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: false }]}
                >
                  <Select
                    placeholder="Select a category (optional)"
                    size="large"
                    allowClear
                  >
                    <Option value="general">General Inquiry</Option>
                    <Option value="support">Technical Support</Option>
                    <Option value="billing">Billing Question</Option>
                    <Option value="feature">Feature Request</Option>
                    <Option value="bug">Bug Report</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[
                    { required: true, message: "Please enter a subject" },
                    { min: 5, message: "Subject must be at least 5 characters" },
                  ]}
                >
                  <Input
                    prefix={<FileTextOutlined />}
                    placeholder="Brief description of your inquiry"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[
                    { required: true, message: "Please enter your message" },
                    { min: 10, message: "Message must be at least 10 characters" },
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    showCount
                    maxLength={2000}
                  />
                </Form.Item>

                <Form.Item
                  name="attachment"
                  label="Attachment (Optional)"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    return e?.fileList;
                  }}
                >
                  <Dragger
                    beforeUpload={() => false}
                    maxCount={1}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                      Support for single file upload. Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG
                    </p>
                  </Dragger>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    block
                    style={{ marginTop: 16 }}
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

