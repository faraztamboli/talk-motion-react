import React from "react";
import { Dropdown, Menu } from "antd";
import { userMenu } from "../../data";
import { useDispatch } from "react-redux";
import { logout } from "../../app/features/loginSlice";

export const UserMenu = () => {
  const dispatch = useDispatch();

  // looks dangerous, but it's not.
  userMenu[3].onClick = () => {
    localStorage.setItem("isLoggedIn", false);
    localStorage.removeItem("token");
    dispatch(logout());
  };

  const menu = (
    <Menu
      style={{ width: "20", transformOrigin: "right", alignSelf: "center" }}
      items={userMenu}
    />
  );
  return (
    <Dropdown
      className=""
      // overlay={menu}
      overlay={menu}
      trigger={["click"]}
      placement="bottomLeft"
      arrow
    >
      <img
        src="/media/avatars/150-2.jpg"
        alt=""
        className=" w-2rem"
        style={{ cursor: "pointer" }}
      />
    </Dropdown>
  );
};
