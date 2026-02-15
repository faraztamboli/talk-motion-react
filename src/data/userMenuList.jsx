import React from "react";
import { Link } from "react-router-dom";
import {
  ContainerOutlined,
  SettingOutlined,
  LogoutOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import JS2Py from "../remotepyjs";

const handleLogout = () => {
  const token = localStorage.getItem("token");
  JS2Py.PythonFunctions.SessionServer.logOut(token, function (res) {
    console.log(res);
    window.localStorage.removeItem("token");
    window.location.href = "/login";
  });
};

const userMenu = [
  {
    key: "user_details",
    label: (
      <Link to="/profile" key={1}>
        <UserMenuProfileItem from="drawer" size="small" />
      </Link>
    ),
  },
  {
    key: "myModels",
    label: (
      <Link to="/my-models" key={2}>
        <div className="user-menu-items">My Models</div>
      </Link>
    ),
    icon: <ContainerOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
  {
    key: "mySubscriptions",
    label: (
      <Link to="/my-subscriptions" key={3}>
        <div className="user-menu-items">My Subscriptions</div>
      </Link>
    ),
    icon: <CreditCardOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
  {
    key: "setting",
    label: (
      <Link to="/setting" key={4}>
        <div className="user-menu-items">Settings</div>
      </Link>
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
      <button
        type="button"
        className="user-menu-items"
        key={5}
        onClick={handleLogout}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogout();
          }
        }}
        style={{
          background: "none",
          border: "none",
          width: "100%",
          padding: "1rem 0.5rem",
          textAlign: "left",
          cursor: "pointer",
          color: "inherit",
          fontSize: "inherit",
          fontFamily: "inherit",
          fontWeight: 600,
          borderRadius: "5px",
        }}
        aria-label="Logout from account"
      >
        Logout
      </button>
    ),
    icon: <LogoutOutlined />,
    style: {
      paddingTop: ".8rem",
      paddingBottom: ".8rem",
    },
  },
];

export default userMenu;
