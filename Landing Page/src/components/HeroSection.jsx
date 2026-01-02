import React from "react";
import { Button, Col, Row } from "antd";
import heroImage from "../media/images/hero-image.png";

function HeroSection(props) {
  return (
    <div className="hero-section">
      <div className="container">
        <Row className="hero-section-row">
          <Col span={12} xs={24} md={12}>
            <div className="hero-content">
              <h1 className="hero-headline">
                <span className="hero-bridges">Building Bridges</span><br/>
                <span className="hero-nowrap">Breaking Barriers</span><br/>
              </h1>
              <p>
                TalkMotion unites Deaf and hearing communities through the power of artificial intelligence — helping families, friends, and colleagues communicate naturally and inclusively, wherever they are.
              </p>
              <div className="hero-content-btns">
                <a
                  href="https://app.talk-motion.com/signup"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    shape="round"
                    size={props.md === true ? "middle" : "large"}
                    ghost
                    className="hero-section-btns"
                  >
                    Join for Free
                  </Button>
                </a>
              </div>
            </div>
          </Col>
          <Col span={12} xs={24} md={12} className="hero-img-div">
            <div className="hero-img">
              <img
                src={heroImage}
                alt="Child signing next to the TalkMotion interface"
                loading="eager"
                decoding="async"
              />
              <figcaption className="sr-only">
                TalkMotion bridges sign and speech for inclusive communication.
              </figcaption>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default HeroSection;
