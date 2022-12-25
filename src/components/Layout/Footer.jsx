import { Layout } from "antd";
import React from "react";

const Footer = (props) => {
  const style = {
    marginLeft: props.collapsedWidth,
    transition: "all .20s ease-in-out",
  };
  const footerStyle = props.collapsed
    ? style
    : { ...style, marginLeft: props.sideBarWidth };

  return (
    <Layout.Footer className="flex flex-center-center" style={footerStyle}>
      Talk Motion © {new Date().getFullYear()} All Rights Reserved.
    </Layout.Footer>
  );
};

export default Footer;
