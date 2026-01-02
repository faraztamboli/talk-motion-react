import React from "react";
import GuidePageContent from "../components/GuidePageContent";
import GuidePageVideo from "../components/GuidePageVideo";
import { Col, Row } from "antd";
import Header from "../components/Header";
import { featuresPageDetails } from "../data/pageDetails";
import MetaDecorator from "../components/HOCs/MetaDecorator";

function GuidePage(props) {
  const { title, description } = featuresPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />

      <div className="guide-page-parent-div">
        <div className="guide-page-container pt-3">

          {/* HERO ROW — ONLY video, centered nicely */}
          <Row
            className="guide-page-hero"
            justify="center"
            align="middle"
            style={{ marginBottom: "1rem" }}
          >
            <Col xs={24} lg={16}>
              <GuidePageVideo lg={props.lg} />
            </Col>
          </Row>

          {/* FEATURES FULL WIDTH */}
          <Row justify="center">
            <Col xs={24}>
              <GuidePageContent />
            </Col>
          </Row>

        </div>
      </div>
    </>
  );
}

export default GuidePage;
