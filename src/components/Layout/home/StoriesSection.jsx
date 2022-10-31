import React from 'react';

import { Col, Row } from 'antd';
import { Link } from 'react-router-dom';

function StoriesSection() {
  return (
    <section className="container stories-section">
      <div className="stories-section-heading-div">
        <h2>Our Stories</h2>
        <Link to="/">View More Stories</Link>
      </div>

      <Row className="stories-card-div">
        <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
          <div className="card stories-card">
            <img src="/media/images/unsplash_PddcoUGPBMw.png" alt="example" />
            <h4>Our Awesome story 1</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate tenetur quibusdam
              iste.
            </p>
            <strong>Read more &gt;</strong>
          </div>
        </Col>

        <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
          <div className="card stories-card">
            <img src="/media/images/unsplash_ylqvfBv8OpQ.png" alt="example" />
            <h4>Our Awesome story 2</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate tenetur quibusdam
              iste.
            </p>
            <strong>Read more &gt;</strong>
          </div>
        </Col>

        <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
          <div className="card stories-card">
            <img src="/media/images/couple-talking-using-sign-language 1.png" alt="example" />
            <h4>Our Awesome story 3</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate tenetur quibusdam
              iste.
            </p>
            <strong>Read more &gt;</strong>
          </div>
        </Col>
      </Row>
    </section>
  );
}

export default StoriesSection;
