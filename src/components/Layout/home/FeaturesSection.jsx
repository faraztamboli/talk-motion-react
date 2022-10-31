import React from 'react';
import { Col, Row } from 'antd';

function FeaturesSection() {
  return (
    <section className="container features-section">
      <h2 className="features-heading">Features</h2>
      <div className="features-cards">
        <Row className="features-cards-row">
          <Col span={7} xs={24} lg={7} className="cards-col">
            <div className="card card-1">
              <div className="card-img">
                <img src="/media/images/card-logo.png" width={100} height={100} alt="card logo" />
              </div>
              <div className="card-content">
                <h3>Signs to Voice</h3>
                <p>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Consequuntur labore
                  eveniet voluptates fugit reiciendis iusto architecto. Placeat esse atque ex
                  commodi est hic obcaecati fuga ut. Accusamus alias et dolore!
                </p>
              </div>
            </div>
          </Col>
          <Col span={7} xs={24} lg={7} className="cards-col">
            <div className="card card-1">
              <div className="card-img">
                <img src="/media/images/card-logo.png" width={100} height={100} alt="card logo" />
              </div>
              <div className="card-content">
                <h3>Voice to Signs</h3>
                <p>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Consequuntur labore
                  eveniet voluptates fugit reiciendis iusto architecto. Placeat esse atque ex
                  commodi est hic obcaecati fuga ut. Accusamus alias et dolore!
                </p>
              </div>
            </div>
          </Col>
          <Col span={7} xs={24} lg={7} className="cards-col">
            <div className="card card-1">
              <div className="card-img">
                <img src="/media/images/card-logo.png" width={100} height={100} alt="card logo" />
              </div>
              <div className="card-content">
                <h3>The Power of AI</h3>
                <p>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Consequuntur labore
                  eveniet voluptates fugit reiciendis iusto architecto. Placeat esse atque ex
                  commodi est hic obcaecati fuga ut. Accusamus alias et dolore!
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
}

export default FeaturesSection;
