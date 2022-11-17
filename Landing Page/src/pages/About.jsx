import { Col, Row } from "antd";
import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PageHeader from "../components/PageHeader";
import TalkMotionImg from "../media/images/talk-motion.png";

function About(props) {
  return (
    <>
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
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Maxime mollitia, molestiae quas vel sint commodi repudiandae
                    consequuntur voluptatum laborum
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
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Maxime mollitia, molestiae quas vel sint commodi repudiandae
                    consequuntur voluptatum laborum
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
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Maxime mollitia, molestiae quas vel sint commodi repudiandae
                    consequuntur voluptatum laborum
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
