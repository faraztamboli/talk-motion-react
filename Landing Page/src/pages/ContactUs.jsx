import React from "react";
import ContactUsForm from "../components/ContactUsForm";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import PageHeader from "../components/PageHeader";
import { contactPageDetails } from "../data/pageDetails";

function ContactUs(props) {
  const { title, description } = contactPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <div className="page-container">
        <PageHeader title="Contact Us" />
      </div>

      <ContactUsForm />
      <Footer />
    </>
  );
}

export default ContactUs;
