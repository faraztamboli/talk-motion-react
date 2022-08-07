import React from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Row, Col } from "antd";
import { UserMenu } from "../ui/UserMenu";

const Header = ({ collapsed, onCollapsed }) => {
  return (
    <Layout.Header
      className="site-layout-background"
      style={{
        padding: 0,
      }}
    >
      <Row
        className="pl-4 pr-5"
        type="flex"
        justify="space-between"
        align="middle"
      >
        <Col>
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => onCollapsed(),
            }
          )}
        </Col>
        <Col>
          <UserMenu />
        </Col>
      </Row>
    </Layout.Header>
  );
};

export default Header;
