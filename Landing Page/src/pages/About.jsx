import { Col, Row } from "antd";
import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import PageHeader from "../components/PageHeader";
import { aboutPageDetails } from "../data/pageDetails";
import TalkMotionImg from "../media/images/talk-motion.png";

function About(props) {
  const { title, description } = aboutPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />

      <Header md={props.md} />

      <PageHeader title="About Us" />

      <div className="container">
        <Row className="about-page-upper-row">
          <Col
            span={12}
            xs={24}
            md={12}
            className="about-page-heading about-page-upper-col"
          >
            <h2>Easy gesture to voice and voice to gesture converter.</h2>
          </Col>
          <Col span={12} xs={24} md={12} className="about-page-upper-col">
            <img
              src={TalkMotionImg}
              alt="Talk Motion"
              className="about-page-upper-col-img"
            />
          </Col>
        </Row>
      </div>

      <section className="about-page-bottom-div">
        <div className="container">
          <h2>Three easy steps</h2>
          <Row className="about-page-bottom-div-row">
            <Col
              span={8}
              xs={24}
              lg={8}
              className="about-page-bottom-div-col-1"
            >
              <div className="about-page-bottom-div-col">
                <div className="number">
                  <p>1</p>
                </div>
                <div className="content">
                  <h2>Train the system to earn points</h2>
                  <p>
                    TalkMotion uses the power of AI to translate sign language
                    to voice and voice to sign language. It allows you to create
                    and train your own custom gestures. We are working with
                    experts in ASL to map a wide range of gestures.
                  </p>
                </div>
              </div>
            </Col>

            <Col
              span={8}
              xs={24}
              lg={8}
              className="about-page-bottom-div-col-2"
            >
              <div className="about-page-bottom-div-col">
                <div className="number">
                  <p>2</p>
                </div>
                <div className="content">
                  <h2>Convert your gustures to voice</h2>
                  <p>
                    Deaf and aphonic people can sign and their movements will be
                    picked up by the gesture detector. An Artificial
                    Intelligence algorithm will convert these gestures into
                    voice.
                  </p>
                </div>
              </div>
            </Col>

            <Col
              span={8}
              xs={24}
              lg={8}
              className="about-page-bottom-div-col-3"
            >
              <div className="about-page-bottom-div-col">
                <div className="number">
                  <p>3</p>
                </div>
                <div className="content">
                  <h2>Convert your voice to gusters</h2>
                  <p>
                    A hearing person can verbally respond, and TalkMotion will
                    display sign language pictures on the screen using voice
                    recognition so that the deaf or aphonic person can
                    understand what the hearing person is saying.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default About;
