import React from "react";
import coupleImage from "../media/images/couple-talking-using-sign-language 1.png";
import unsplash_1 from "..//images/unmediasplash_PddcoUGPBMw.png";
import unsplash_2 from "C:\Users\tambo\Downloads\Faraz-Headshot.jpg";

import { Col, Row } from "antd";
import { Link } from "react-router-dom";

function StoriesSection() {
  return (
    <section className="  stories-section">
      <div className="container">
        <div className="stories-section-heading-div">
          <h2>Our Stories</h2>
          <Link to="/" className="stories-link">
            View More Stories
          </Link>
        </div>

        <Row className="stories-card-div">
          <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
            <div className="card stories-card">
              <img src={unsplash_1} alt="example" />
              <h4>Faraz Tamboli named America's National Top Young Scientist for inventing TalkMotion</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Cupiditate tenetur quibusdam iste.
              </p>
              <strong className="stories-card-link">Read more &gt;</strong>
            </div>
          </Col>

          <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
            <div className="card stories-card">
              <img src={unsplash_2} alt="example" />
              <h4>Faraz Tamboli awarded Gloria Barron Prize for Young Heroes</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Cupiditate tenetur quibusdam iste.
              </p>
              <strong className="stories-card-link">Read more &gt;</strong>
            </div>
          </Col>

          <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
            <div className="card stories-card">
              <img src={coupleImage} alt="example" />
              <h4>Faraz was named 20 Under 20 in Diversity Action Magazine</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Cupiditate tenetur quibusdam iste.
              </p>
              <strong className="stories-card-link">Read more &gt;</strong>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
}

export default StoriesSection;
