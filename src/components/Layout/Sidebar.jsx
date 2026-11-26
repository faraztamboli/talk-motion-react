import React, { useMemo } from "react";
import { Layout, Menu } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { buildSidebarItems, accountFlags, selectedSidebarKey } from "../../data/sidebarNav";
import { useFlags } from "../../hooks/useFlag";
import logoImg from "../../media/images/logo.png";
import logoSmall from "../../media/images/logo-small.png";

const { Sider } = Layout;

const Sidebar = (props) => {
  const flags = useFlags();
  const navigate = useNavigate();
  const location = useLocation();
  const apiUser = useSelector((state) => state.apiAuth?.user);
  const items = useMemo(() => buildSidebarItems({ ...flags, ...accountFlags(apiUser) }), [flags, apiUser]);
  const selected = selectedSidebarKey(items, location.pathname, location.search);

  return (
    <Sider
      className="side-bar"
      trigger={null}
      collapsible="true"
      collapsedWidth={props.collapsedWidth}
      width={props.sideBarWidth}
      collapsed={props.collapsed}
    >
      <div className="logo">
        {props.sideBarWidth === 200 && !props.collapsed ? (
          <img src={logoImg} alt="TalkMotion" className="center rounded" />
        ) : (
          <img src={logoSmall} alt="TalkMotion" className="center rounded" />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        className="tm-sidebar-menu"
        selectedKeys={selected ? [selected] : []}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default Sidebar;
