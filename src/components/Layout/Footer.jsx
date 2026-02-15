import { Layout } from "antd";
import React from "react";
import { Link } from "react-router-dom";

const Footer = (props) => {
  const style = {
    marginLeft: props.collapsedWidth,
    transition: "all .20s ease-in-out",
  };
  const footerStyle = props.collapsed
    ? style
    : { ...style, marginLeft: props.sideBarWidth };

  return (
    <Layout.Footer 
      className="flex flex-center-center" 
      style={{ ...footerStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}
    >
      <span>Talk Motion © {new Date().getFullYear()} All Rights Reserved.</span>
      <Link 
        to="/contact-us" 
        style={{ color: "inherit", textDecoration: "none", marginLeft: "16px" }}
      >
        Contact Us
      </Link>
    </Layout.Footer>
  );
};

export default Footer;
