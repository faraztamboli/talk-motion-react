import React from "react";
import { Layout } from "antd";
import Header from "../Layout/Header";
import Sidebar from "../Layout/Sidebar";
import selectLayout from "./NoLayout";
import Footer from "./Footer";

function AppLayout(props) {
  return (
    <Layout>
      <Sidebar
        collapsed={props.collapsed}
        onCollapsed={props.onCollapsed}
        sideBarWidth={props.sideBarWidth}
        collapsedWidth={props.collapsedWidth}
      />
      <Layout>
        <Header collapsed={props.collapsed} onCollapsed={props.onCollapsed} />
        <div className="site-layout-background" style={{ minHeight: 360 }}>
          {props.children}
        </div>
        <Footer />
      </Layout>
    </Layout>
  );
}

export default selectLayout(AppLayout);
