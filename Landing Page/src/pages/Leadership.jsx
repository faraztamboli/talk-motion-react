import React from "react";
import { Col, Row } from "antd";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import PageHeader from "../components/PageHeader";
import { pageContent } from "../data/appContent";
import { termsPageDetails } from "../data/pageDetails";
import Faraz from "../components/Faraz";
import Neelofar from "../components/Neelofar";

function PrivacyPolicy(props) {
  const { title, description } = termsPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div className="page-container">
        <Header md={props.md} />
        <PageHeader title="Meet Our Team" />

<div className="team-wrap">
  <Row
    gutter={[40, 40]}          // small, consistent spacing
    justify="center"
    align="top"
    wrap
  >
    {/* Use flex to keep cards close and equal in width */}
    <Col xs={24} sm={24} md={11} lg={11} xl={11} xxl={10} flex="0 1 540px">
      <Faraz />
    </Col>
    <Col xs={4} sm={4} md={4} lg={4} xl={4} xxl={4} flex="0 1 540px">
    </Col>
    <Col xs={24} sm={24} md={11} lg={11} xl={11} xxl={10} flex="0 1 540px">
      <Neelofar />
    </Col>
  </Row>
</div>
<br/><br/><br/>

        <Footer />
      </div>
    </>
  );
}

export default PrivacyPolicy;
