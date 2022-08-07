import { Layout, Menu } from "antd";
import React from "react";
import items from "../../data/sidebarNav";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => (
  <Sider
    breakpoint="lg"
    onBreakpoint={(broken) => {
      console.log(broken);
    }}
    onCollapse={(collapsed, type) => {
      console.log(collapsed, type);
    }}
    trigger={null}
    collapsible
    collapsed={collapsed}
  >
    <div className="logo">
      {!collapsed ? (
        <img src="/logo.png" alt="logo" className="center rounded" />
      ) : (
        <img src="/favicon.png" alt="logo" className="center rounded" />
      )}
    </div>
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={["1"]}
      // items={items.map((item) => ({
      //   ...item,
      // }))}
    >
      {items.map((item) => (
        <Menu.Item key={item.key}>
          <Link to={item.path}>
            {item.icon} <span>{item.label}</span>
          </Link>
        </Menu.Item>
      ))}
    </Menu>
  </Sider>
);

export default Sidebar;
