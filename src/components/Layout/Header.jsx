import React from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout } from "antd";

const Header = ({ collapsed, onCollapsed }) => {
  return (
    <Layout.Header
      className="site-layout-background"
      style={{
        padding: 0,
      }}
    >
      {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
        className: "trigger",
        onClick: () => onCollapsed(),
      })}
    </Layout.Header>
  );
};

export default Header;
