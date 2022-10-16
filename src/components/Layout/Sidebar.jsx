import { Layout, Menu } from 'antd';
import React from 'react';
import items from '../../data/sidebarNav';

const { Sider } = Layout;

const Sidebar = props => {
  return (
    <Sider
      trigger={null}
      collapsible="true"
      collapsedWidth={props.collapsedWidth}
      width={props.sideBarWidth}
      collapsed={props.collapsed}
    >
      <div className="logo">
        {props.sideBarWidth === 200 && !props.collapsed ? (
          <img src="/logo.png" alt="logo" className="center rounded" />
        ) : (
          <img src="/favicon.png" alt="logo" className="center rounded" />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['']}
        items={items.map(item => ({
          ...item,
        }))}
      />
    </Sider>
  );
};

export default Sidebar;
