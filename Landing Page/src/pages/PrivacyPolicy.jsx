import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import PageHeader from "../components/PageHeader";
import { pageContent } from "../data/appContent";
import { privacyPolicyPageDetails } from "../data/pageDetails";

function PrivacyPolicy(props) {
  const { title, description } = privacyPolicyPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div className="page-container">
        <Header md={props.md} />
        <PageHeader title="Privacy Policy" />

        <section className="container privacy-policy-content">
          <div>{pageContent.privacyPolicyContent}</div>
        </section>
        <Footer />
      </div>
    </>
  );
}

export default PrivacyPolicy;
