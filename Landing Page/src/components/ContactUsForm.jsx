// src/components/ContactUsForm.jsx
import React, { useState } from "react";
import { Col, Form, Input, Row, message, Button, Radio } from "antd";
import emailjs from "emailjs-com";
import { pageContent } from "../data/appContent";  // reuse your stored text

function ContactUsForm() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [channel, setChannel] = useState("email");

  const API_URL = import.meta.env.VITE_CONTACT_API_URL ?? "/api/contact";
  const EJ_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "service_tc4ncd4";
  const EJ_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "template_8vwlwpg";
  const EJ_PUBLIC = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "KS80dVx4DYpL3XfBD";

  const sendViaEmailJS = async (values) => {
    if (!EJ_SERVICE || !EJ_TEMPLATE || !EJ_PUBLIC) {
      message.error("Email endpoint missing and EmailJS not configured.");
      return false;
    }
    await emailjs.send(
      EJ_SERVICE,
      EJ_TEMPLATE,
      {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        message: values.msg,
      },
      EJ_PUBLIC
    );
    return true;
  };

  const onFinish = async (values) => {
    const { firstName, lastName, email, msg } = values;

    if (channel === "whatsapp") {
      const phoneE164 = "16097219447";
      const text = `Contact form submission:\nName: ${firstName} ${lastName}\nEmail: ${email}\nMessage: ${msg}`;
      const waUrl = `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      setSubmitting(true);

      // Try your backend first
      let sent = false;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          sent = true;
        } else if (res.status === 404) {
          // No backend route — fall back to EmailJS
          const ok = await sendViaEmailJS(values);
          if (ok) sent = true;
          else {
            const bodyText = await res.text().catch(() => "");
            console.error("Contact API error 404", bodyText);
            message.error("Send failed (404). No backend route and EmailJS not configured.");
          }
        } else {
          const bodyText = await res.text().catch(() => "");
          console.error("Contact API error", res.status, bodyText);
          message.error(`Send failed (status ${res.status}).`);
        }
      } catch (netErr) {
        // Network error (wrong domain/CORS). Try EmailJS.
        console.warn("Network error to API, trying EmailJS...", netErr);
        const ok = await sendViaEmailJS(values);
        if (ok) sent = true;
        else message.error("Network error to API and EmailJS not configured.");
      }

      if (sent) {
        message.success("Thanks! Your message has been sent.");
        form.resetFields();
      }
    } catch (err) {
      console.error("Unhandled error", err);
      message.error("Sorry — something went wrong sending your message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-us-form-wrapper">
      <div className="container">
        <div className="contact-us-form-parent-div">
          <div className="contact-us-form">
            {/* --- Minimal text content restored here --- */}
            <h2 className="text-center text-white mb-4">
              {pageContent?.contactPageHeading || "Get in Touch"}
            </h2>
            <p className="contact-us-form-intro text-white mb-6">
              {pageContent?.contactPageContent ||
                "At TalkMotion, we’re here to help improve your communication experience. Fill out the form below or message us on WhatsApp."}
            </p>
            <Form form={form} layout="vertical" onFinish={onFinish} disabled={submitting}>
              <Row className="contact-us-form-first-row" gutter={[16, 0]}>
                <Col span={11} xs={24} md={11}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: "Please enter first name" }]}
                  >
                    <Input size="large" placeholder="First Name" className="contact-us-form-input" />
                  </Form.Item>
                </Col>
                <Col span={11} xs={24} md={11}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: "Please enter last name" }]}
                  >
                    <Input size="large" placeholder="Last Name" className="contact-us-form-input" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input size="large" placeholder="Email Address" className="contact-us-form-input" />
              </Form.Item>

              <Form.Item
                name="msg"
                label="Message"
                rules={[{ required: true, message: "Please enter a message" }]}
              >
                <Input.TextArea className="contact-us-form-input" size="large" placeholder="Message" style={{ height: 150 }} />
              </Form.Item>

              <Form.Item>
                <Radio.Group value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <Radio.Button value="email">Send via Email</Radio.Button>
                  <Radio.Button value="whatsapp">Send via WhatsApp</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <p className="contact-us-form-small">By sending this you agree to our privacy policy.</p>
              </Form.Item>

              <Row className="contact-us-form-submit-row">
                <Form.Item>
                  <Button
                    type="primary"
                    size="large"
                    shape="round"
                    htmlType="submit"
                    loading={submitting}
                    className="contact-us-form-submit-btn"
                    style={{ color: "#ffffff" }}
                  >
                    {channel === "whatsapp" ? "Open WhatsApp" : "Submit"}
                  </Button>
                </Form.Item>
              </Row>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactUsForm;
