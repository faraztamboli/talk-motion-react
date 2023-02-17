import React from "react";
import { Layout } from "antd";
import Header from "../Layout/Header";
import Sidebar from "../Layout/Sidebar";
import selectLayout from "../HOCs/SelectLayout";
import Footer from "./Footer";
import { Content } from "antd/es/layout/layout";

function AppLayout(props) {
  const style = {
    marginLeft: props.collapsedWidth,
    transition: "all .20s ease-in-out",
  };
  const layoutStyle = props.collapsed
    ? style
    : { ...style, marginLeft: props.sideBarWidth, paddingTop: "8rem" };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        collapsed={props.collapsed}
        onCollapsed={props.onCollapsed}
        sideBarWidth={props.sideBarWidth}
        collapsedWidth={props.collapsedWidth}
      />
      <Layout hasSider>
        <Sidebar
          collapsed={props.collapsed}
          onCollapsed={props.onCollapsed}
          sideBarWidth={props.sideBarWidth}
          collapsedWidth={props.collapsedWidth}
        />
        <Content
          className="site-layout-background"
          style={{ minHeight: "100vh" }}
        >
          <Layout className="site-layout" style={layoutStyle}>
            <>{props.children}</>
          </Layout>
        </Content>
      </Layout>
      <Footer
        collapsed={props.collapsed}
        collapsedWidth={props.collapsedWidth}
        sideBarWidth={props.sideBarWidth}
      />
    </Layout>
  );
}

export default selectLayout(AppLayout);
