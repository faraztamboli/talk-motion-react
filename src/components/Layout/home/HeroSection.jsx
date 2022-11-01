import React from 'react';
import { Button, Col, Row } from 'antd';

function HeroSection(props) {
  return (
    <div className="hero-section">
      <Row className="hero-section-row">
        <Col span={12} xs={24} md={12}>
          <div className="hero-content">
            <h1>Connecting Two Worlds...</h1>
            <p>
              Talk-motion brings the world of deaf and speaking people together, reuniting families,
              friends and colleagues with the power of artificial intelligence.
            </p>
            <div className="hero-content-btns">
              <Button
                shape="round"
                size={props.md === true ? 'middle' : 'large'}
                className="hero-section-btns"
              >
                Pricing
              </Button>
              <Button
                shape="round"
                size={props.md === true ? 'middle' : 'large'}
                ghost
                className="hero-section-btns"
              >
                Get a Demo
              </Button>
            </div>
          </div>
        </Col>
        <Col span={12} xs={24} md={12} className="hero-img-div">
          <div className="hero-img">
            <img
              src="/media/images/body-language-portrait-friendly-looking-positive-dark-skinned-little-boy-t-shirt-connecting-fore-finger-thumb-making-approval-gesture-showing-okay-sign-saying-everything-is-fine 1.png"
              alt="Gesture from a little boy"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default HeroSection;
