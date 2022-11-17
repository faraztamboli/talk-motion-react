import React from "react";
import { Row, Col } from "antd";
import { Link } from "react-router-dom";
import { TwitterOutlined, FacebookFilled } from "@ant-design/icons";

function Footer() {
  return (
    <footer id="contact">
      <div className="container">
        <Row className="container footer-upper-div">
          <Col>
            <h2>Sign Up to stay connected</h2>
          </Col>
          <Col className="footer-upper-div-input-section">
            <input
              type="email"
              placeholder="Enter email address"
              className="footer-input"
            />
            <button className="footer-input-btn">Sign Up</button>
          </Col>
        </Row>

        <div className="footer-bottom-div">
          <Row>
            <Col span={12} xs={24} lg={12} className="footer-bottom-div-col">
              <h2>TalkMotion</h2>
              <p>
                orem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam
              </p>
            </Col>

            <Col span={6} xs={24} lg={6} className="footer-bottom-div-col">
              <h5>Important Links</h5>
              <ul>
                <li>
                  <Link to="/privacy-policy">FAQs</Link>
                </li>
                <li>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/privacy-policy">Terms & Conditions</Link>
                </li>
              </ul>
            </Col>

            <Col span={6} xs={24} lg={6} className="footer-bottom-div-col">
              <h5>Social Links</h5>
              <div className="social-links-icons-div">
                <TwitterOutlined className="social-links-icons" />
                <FacebookFilled className="social-links-icons" />
              </div>
            </Col>
          </Row>
        </div>

        <div className="copyright">
          <p>
            All copyrights reserved {new Date().getFullYear()} © TalkMotion.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
