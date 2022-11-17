import React from "react";
import ContactUsForm from "../components/ContactUsForm";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PageHeader from "../components/PageHeader";

function ContactUs(props) {
  return (
    <>
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
