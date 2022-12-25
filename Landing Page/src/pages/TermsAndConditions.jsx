import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PageHeader from "../components/PageHeader";
import { pageContent } from "../data/appContent";

function PrivacyPolicy(props) {
  return (
    <div className="page-container">
      <Header md={props.md} />
      <PageHeader title="Terms and Conditions" />

      <section className="container privacy-policy-content">
        <div>{pageContent.termsAndConditionsContent}</div>
      </section>
      <Footer />
    </div>
  );
}

export default PrivacyPolicy;
