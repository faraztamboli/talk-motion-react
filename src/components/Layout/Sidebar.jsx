import { Layout, Menu } from 'antd';
import React from 'react';
import items from '../../data/sidebarNav';
import { Link } from 'react-router-dom';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => (
  <Sider trigger={null} collapsible collapsed={collapsed}>
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
      defaultSelectedKeys={['']}
      items={items.map(item => ({
        ...item,
      }))}
    />
  </Sider>
);

export default Sidebar;
