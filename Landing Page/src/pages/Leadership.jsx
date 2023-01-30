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

      <div className="purchase-model-list ">
        <Row>
          <Col span={12} xs={24} lg={12} className="payment-first-col">
            <Faraz />
          </Col>
          <Col span={12} xs={24} lg={12} className="payment-first-col">
            <Neelofar />
          </Col>
        </Row>
      </div>

        <Footer />
      </div>
    </>
  );
}

export default PrivacyPolicy;
