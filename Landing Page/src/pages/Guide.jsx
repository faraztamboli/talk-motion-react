import React from "react";
import GuidePageContent from "../components/GuidePageContent";
import GuidePageVideo from "../components/GuidePageVideo";
import { Col, Row } from "antd";
import Header from "../components/Header";

function GuidePage(props) {
  return (
    <>
      <Header md={props.md} />
      <div
        className="guide-page-parent-div"
        style={{ backgroundColor: "rgb(249 249 249)" }}
      >
        <div className="guide-page-container" style={{ paddingTop: "3rem" }}>
          <Row style={{ minHeight: "83vh" }} className="guide-page">
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
