import React from "react";
import { Button, Col, Row } from "antd";
import { Link } from "react-router-dom";
import heroImage from "../media/images/hero-image.png";

function HeroSection(props) {
  return (
    <div className="hero-section">
      <div className="container">
        <Row className="hero-section-row">
          <Col span={12} xs={24} md={12}>
            <div className="hero-content">
              <h1>Connecting Two Worlds...</h1>
              <p>
                Talk-motion brings the world of deaf and speaking people
                together, reuniting families, friends and colleagues with the
                power of artificial intelligence.
              </p>
              <div className="hero-content-btns">
                <Link to="/signup">
                  <Button
                    shape="round"
                    size={props.md === true ? "middle" : "large"}
                    ghost
                    className="hero-section-btns"
                  >
                    Signup for Free
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
          <Col span={12} xs={24} md={12} className="hero-img-div">
            <div className="hero-img">
              <img src={heroImage} alt="Gesture from a little boy" />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default HeroSection;
