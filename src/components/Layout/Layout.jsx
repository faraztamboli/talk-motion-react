import React from "react";
import { Layout } from "antd";
import Header from "../Layout/Header";
import Sidebar from "../Layout/Sidebar";
import selectLayout from "../HOCs/SelectLayout";
import Footer from "./Footer";

function AppLayout(props) {
  const style = {
    marginLeft: props.collapsedWidth,
    transition: "all .20s ease-in-out",
  };
  const layoutStyle = props.collapsed
    ? style
    : { ...style, marginLeft: props.sideBarWidth };

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar
          collapsed={props.collapsed}
          onCollapsed={props.onCollapsed}
          sideBarWidth={props.sideBarWidth}
          collapsedWidth={props.collapsedWidth}
        />
        <Layout>
          <Header
            collapsed={props.collapsed}
            onCollapsed={props.onCollapsed}
            sideBarWidth={props.sideBarWidth}
            collapsedWidth={props.collapsedWidth}
          />
          <div
            className="site-layout-background"
            style={{ minHeight: "100vh" }}
          >
            <Layout style={layoutStyle}>
              <>{props.children}</>
            </Layout>
          </div>
          <Footer
            collapsed={props.collapsed}
            collapsedWidth={props.collapsedWidth}
            sideBarWidth={props.sideBarWidth}
          />
        </Layout>
      </Layout>
    </>
  );
}

export default selectLayout(AppLayout);
