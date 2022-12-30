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
          <Row className="guide-page mh-83vh">
            <Col span={12} xs={24} lg={12}>
              <GuidePageVideo lg={props.lg} />
            </Col>
            <Col span={12} xs={24} lg={12}>
              <GuidePageContent sm={props.sm} lg={props.lg} />
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default GuidePage;
