import React from "react";
import { Dropdown, Menu } from "antd";
import { userMenu } from "../../data";
import { useDispatch } from "react-redux";
import { logout } from "../../app/features/loginSlice";

export const UserMenu = () => {
  const dispatch = useDispatch();

  userMenu[3].onClick = () => {
    localStorage.setItem("isLoggedIn", false);
    localStorage.removeItem("token");
    dispatch(logout());
  };

  return (
    <Dropdown menu={userMenu} trigger={["click"]} placement="bottomLeft" arrow>
      <img
        src="/media/avatars/150-2.jpg"
        alt=""
        className=" w-2rem"
        style={{ cursor: "pointer" }}
      />
    </Dropdown>
  );
};
