import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import PageHeader from "../components/PageHeader";
import { pageContent } from "../data/appContent";
import { termsPageDetails } from "../data/pageDetails";

function PrivacyPolicy(props) {
  const { title, description } = termsPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div className="page-container">
        <Header md={props.md} />
        <PageHeader title="Terms and Conditions" />

        <section className="container privacy-policy-content">
          <div>{pageContent.termsAndConditionsContent}</div>
        </section>
        <Footer />
      </div>
    </>
  );
}

export default PrivacyPolicy;
