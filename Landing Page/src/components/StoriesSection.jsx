import React from "react";
import coupleImage from "../media/images/diversity-in-action.png";
import unsplash_1 from "../media/images/3m-young-scientist.png";
import unsplash_2 from "../media/images/gloria-barron.png";

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
              <h4>Faraz named America's National Top Young Scientist for inventing TalkMotion</h4>
              <p>
              Faraz invented TalkMotion, a talking device for deaf and 
              aphonic children, that turns a sign language gesture into 
              verbal language, or verbal language into sign language gestures.
              alkMotion turns a sign language gesture into verbal language 
              or verbal language into sign language gestures. 
              Translating between sign language and voice can make it 
              easier for people who are deaf or hard of hearing to 
              communicate with those who do not know sign language and 
              vice versa. This technology has the potential to break down 
              barriers and facilitate greater understanding and 
              communication between people of different backgrounds 
              and abilities.
              </p>
              <a
              href="https://youngscientistlab.com/alumni-center/alumni-spotlight/faraz-tamboli"
              target="_blank"
              rel="noreferrer"
              >
                <strong className="stories-card-link">Read more &gt;</strong>            
              </a>
            </div>
          </Col>

          <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
            <div className="card stories-card">
              <img src={unsplash_2} alt="example" />
              <h4>Faraz awarded Gloria Barron Prize for Young Heroes</h4>
              <p>
              Faraz Tamboli invented TalkMotion, a device that helps people 
              who are deaf and aphonic (voiceless) communicate with people 
              who can hear. His device translates sign language into verbal 
              language and verbal language back into sign language.
              </p>
              <a
              href="https://barronprize.org/meet-the-winners/2021-winners/#TalkMotion"
              target="_blank"
              rel="noreferrer"
              >
                <strong className="stories-card-link">Read more &gt;</strong>            
              </a>            </div>
          </Col>

          <Col span={7} xs={24} md={12} lg={7} className="stories-card-col">
            <div className="card stories-card">
              <img src={coupleImage} alt="example" />
              <h4>Faraz was named 20 Under 20 in Diversity Action Magazine</h4>
              <p>
              Faraz was featured in the terrific “20 Under 20” article in the 
              Summer 2022 issue of Diversity in Action magazine.
              </p>
              <a
              href="https://mydigitalpublication.com/publication/?m=46265&i=751044&p=1&ver=html5"
              target="_blank"
              rel="noreferrer"
              >
                <strong className="stories-card-link">Read more &gt;</strong>            
              </a>            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
}

export default StoriesSection;
