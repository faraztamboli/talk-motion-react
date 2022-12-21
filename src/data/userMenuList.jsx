import React from "react";
import { Link } from "react-router-dom";
import {
  ContainerOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";

const handleLogout = () => {};

const userMenu = [
  {
    key: "user_details",
    label: (
      <Link to="/profile" key={1}>
        <UserMenuProfileItem size="small" />
      </Link>
    ),
  },
  {
    key: "myModels",
    label: (
      <div className="user-menu-items" key={2}>
        <Link to="/my-models">My Models</Link>
      </div>
    ),
    icon: <ContainerOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
  {
    key: "setting",
    label: (
      <div className="user-menu-items" key={3}>
        <Link to="/settings">Settings</Link>
      </div>
    ),
    icon: <SettingOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
  {
    key: "logout",
    id: "logout",
    label: (
      <div className="user-menu-items" key={4} onClick={handleLogout}>
        Logout
      </div>
    ),
    icon: <LogoutOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
];

export default userMenu;
