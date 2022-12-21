import React from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Row, Col } from "antd";
import { UserMenu } from "../ui/UserMenu";

const Header = (props) => {
  const style = {
    padding: 0,
    position: "sticky",
    top: 0,
    zIndex: 1,
    width: "auto",
    marginLeft: props.collapsedWidth,
    transition: "all .10s ease-in-out",
  };

  const headerStyle = props.collapsed
    ? style
    : {
        ...style,
        marginLeft: props.sideBarWidth,
        transition: "all .30s ease-in-out",
      };

  return (
    <Layout.Header className="site-layout-background" style={headerStyle}>
      <Row
        className="pl-4 pr-5"
        type="flex"
        justify="space-between"
        align="middle"
      >
        <Col>
          {React.createElement(
            props.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => props.onCollapsed(),
            }
          )}
        </Col>
        <Col className="flex flex-center-center">
          <UserMenu />
        </Col>
      </Row>
    </Layout.Header>
  );
};

export default Header;
