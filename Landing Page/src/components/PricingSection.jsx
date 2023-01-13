import React from "react";
import { Button, Col, Row } from "antd";
import { Link } from "react-router-dom";

function PricingSection() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <h2 className="pricing-heading">Pricing</h2>
        <div className="pricing-cards">
          <Row className="pricing-cards-row">
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-content">
                  <h4>Basic</h4>
                  <h6>Voice to Gesture</h6>
                  <strong>Free</strong>
                  <p>With this package you can convert voice into sign language.</p>
                  <Link to={"/payment"} className="card-btn-link">
                    <Button shape="round" size="large" className="card-btn">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-content">
                  <h4>Pro</h4>
                  <h6>Full Package</h6>
                  <span className="pricing-span">$</span>
                  <strong>9.95</strong>
                  <span className="pricing-span">/month</span>
                  <p>With this package you can convert voice -> gesture & vice versa; build custom gestures</p>
                  <Link to={"/payment"} className="card-btn-link">
                    <Button shape="round" size="large" className="card-btn">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col span={7} xs={24} lg={7} className="cards-col">
              <div className="card card-1">
                <div className="card-content">
                  <h4>Enterprise</h4>
                  <h6>Custom</h6>
                  <span className="pricing-span">$</span>
                  <strong>__.__</strong>
                  <p>For schools and companies. <br/>Please <Link to="/contact-us" className="footer-links">contact us</Link> for pricing.</p>
                  <Link to={"/payment"} className="card-btn-link">
                    <Button shape="round" size="large" className="card-btn">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
