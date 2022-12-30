import React from "react";
import { Row, Col } from "antd";
import { Link } from "react-router-dom";
import { TwitterOutlined, FacebookFilled } from "@ant-design/icons";
import { pageContent } from "../data/appContent";

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
            <a
              href="https://app.talk-motion.com/signup"
              target="_blank"
              rel="noreferrer"
            >
              <button className="footer-input-btn">Sign Up</button>
            </a>
          </Col>
        </Row>

        <div className="footer-bottom-div">
          <Row>
            <Col span={12} xs={24} lg={12} className="footer-bottom-div-col">
              <h2>TalkMotion</h2>
              {pageContent.TalkMotionDescription}
            </Col>

            <Col span={6} xs={24} lg={6} className="footer-bottom-div-col">
              <h5>Important Links</h5>
              <ul>
                <li>
                  <Link to="/privacy-policy" className="footer-links">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="footer-links">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="footer-links">
                    Terms & Conditions
                  </Link>
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
