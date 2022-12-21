import { Link } from "react-router-dom";
import {
  ContainerOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import React from "react";

const userMenu = [
  {
    key: "user_details",
    label: (
      <Link to="/profile">
        <UserMenuProfileItem size="small" />
      </Link>
    ),
  },
  {
    key: "myModels",
    label: (
      <div className="user-menu-items">
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
    key: "settings",
    label: (
      <div className="user-menu-items">
        <Link to="/settings">Settings</Link>,
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
    label: <div className="user-menu-items">Logout</div>,
    icon: <LogoutOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
];

export default userMenu;
