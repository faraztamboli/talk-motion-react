import React from "react";
import { Col, Row } from "antd";
import featureImage from "../media/images/card-logo.png";
import featureImage1 from "../media/images/gesture-to-voice.png";
import featureImage2 from "../media/images/voice-to-gesture.png";
import featureImage3 from "../media/images/artificial-intelligence.png";

function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2 className="features-heading">Features</h2>
        <div className="features-cards">
          <Row className="features-cards-row">
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-img">
                  <img
                    src={featureImage}
                    width={100}
                    height={100}
                    alt="card logo"
                  />
                </div>
                <div className="card-content">
                  <h3>Signs to Voice</h3>
                  <p>
                    Deaf and aphonic people can sign and their movements will be
                    picked up by the gesture detector. An Artificial
                    Intelligence algorithm will convert these gestures into
                    voice.
                  </p>
                </div>
              </div>
            </Col>
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-img">
                  <img
                    src={featureImage}
                    width={100}
                    height={100}
                    alt="card logo"
                  />
                </div>
                <div className="card-content">
                  <h3>Voice to Signs</h3>
                  <p>
                    A hearing person can verbally respond, and TalkMotion will
                    display sign language pictures on the screen using voice
                    recognition so that the deaf or aphonic person can
                    understand what the hearing person is saying.
                  </p>
                </div>
              </div>
            </Col>
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-img">
                  <img
                    src={featureImage3}
                    width={100}
                    height={100}
                    alt="card logo"
                  />
                </div>
                <div className="card-content">
                  <h3>The Power of AI</h3>
                  <p>
                    TalkMotion uses the power of AI to translate sign language
                    to voice and voice to sign language. It allows you to create
                    and train your own custom gestures. We are working with
                    experts in ASL to map a wide range of gestures.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
