import React from "react";
import { Drawer } from "antd";
import { userMenu } from "../../data";

export const UserMenu = () => {
  const [open, setOpen] = React.useState(false);

  const showUserMenu = () => {
    setOpen(true);
  };

  const hideUserMenu = () => {
    setOpen(false);
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
