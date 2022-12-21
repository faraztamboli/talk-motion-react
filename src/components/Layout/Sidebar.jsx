import React from "react";
import { Layout, Menu } from "antd";
import items from "../../data/sidebarNav";
import logoImg from "../../media/images/logo.png";
import logoSmall from "../../media/images/logo-small.png";

const { Sider } = Layout;

const Sidebar = (props) => {
  return (
    <Sider
      trigger={null}
      collapsible="true"
      collapsedWidth={props.collapsedWidth}
      width={props.sideBarWidth}
      collapsed={props.collapsed}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="logo">
        {props.sideBarWidth === 200 && !props.collapsed ? (
          <img src={logoImg} alt="logo" className="center rounded" />
        ) : (
          <img src={logoSmall} alt="logo" className="center rounded" />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={items.map((item) => ({
          ...item,
        }))}
      />
    </Sider>
  );
};

export default Sidebar;
