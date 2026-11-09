import React from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Row, Col } from "antd";
import { UserMenu } from "../ui/UserMenu";
import LanguageSelector from "../ui/LanguageSelector";
import HeaderCartButton from "../../features/store/HeaderCartButton";
import FeatureGate from "../flags/FeatureGate";

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
    <Layout.Header 
      className="site-layout-background" 
      style={{
        ...headerStyle,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderBottom: "1px solid var(--color-neutral-200)"
      }}
    >
      <Row
        className="pl-4 pr-5"
        type="flex"
        justify="space-between"
        align="middle"
        style={{ height: "100%" }}
      >
        <Col>
          {React.createElement(
            props.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => props.onCollapsed(),
              style: {
                fontSize: "18px",
                color: "var(--color-neutral-700)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                padding: "8px",
                borderRadius: "6px"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = "var(--color-neutral-100)";
                e.currentTarget.style.color = "var(--color-primary)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-neutral-700)";
              }
            }
          )}
        </Col>
        <Col className="flex flex-center-center" style={{ gap: "16px" }}>
          <LanguageSelector size="default" />
          <FeatureGate flag="legacy_models_visible">
            <HeaderCartButton />
          </FeatureGate>
          <UserMenu />
        </Col>
      </Row>
    </Layout.Header>
  );
};

export default Header;
