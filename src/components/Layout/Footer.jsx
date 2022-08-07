import { Layout } from "antd";
import React from "react";

const Footer = () => {
  return (
    <Layout.Footer
      style={{
        textAlign: "center",
      }}
    >
      Talk Motion © {new Date().getFullYear()} All Rights Reserved.
    </Layout.Footer>
  );
};

export default Footer;
