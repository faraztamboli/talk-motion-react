import React from "react";
import { Layout } from "antd";
import Header from "../Layout/Header";
import Sidebar from "../Layout/Sidebar";
import selectLayout from "./NoLayout";
import Footer from "./Footer";

function AppLayout(props) {
  return (
    <>
      <Layout>
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
          <div className="site-layout-background" style={{ minHeight: 360 }}>
            <Layout
              style={
                props.collapsed
                  ? {
                      marginLeft: props.collapsedWidth,
                      transition: "all .20s ease-in-out",
                    }
                  : {
                      marginLeft: props.sideBarWidth,
                      transition: "all .20s ease-in-out",
                    }
              }
            >
              {props.children}
            </Layout>
          </div>
          <Footer />
        </Layout>
      </Layout>
    </>
  );
}

export default selectLayout(AppLayout);
