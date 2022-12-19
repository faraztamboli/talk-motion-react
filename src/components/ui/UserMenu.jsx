import React from "react";
import { Drawer } from "antd";
import { userMenu } from "../../data";
import { useDispatch } from "react-redux";
import { logout } from "../../app/features/loginSlice";

export const UserMenu = () => {
  const [open, setOpen] = React.useState(false);
  const dispatch = useDispatch();

  const showUserMenu = () => {
    setOpen(true);
  };

  const hideUserMenu = () => {
    setOpen(false);
  };

  userMenu[3].onClick = () => {
    localStorage.setItem("isLoggedIn", false);
    localStorage.removeItem("token");
    dispatch(logout());
  };

  return (
    <>
      <img
        src="/media/avatars/150-2.jpg"
        alt=""
        className=" w-2rem"
        style={{ cursor: "pointer" }}
        onClick={showUserMenu}
      />
      <Drawer placement="right" open={open} onClose={hideUserMenu}>
        {userMenu.map((element) => {
          return element.label;
        })}
      </Drawer>
    </>
  );
};
