import React from "react";
import { Drawer } from "antd";
import { userMenu } from "../../data";
import { useSelector } from "react-redux";
import userIcon from "../../media/images/user-icon.jpg";

export const UserMenu = () => {
  const [open, setOpen] = React.useState(false);
  const { profileImg } = useSelector((state) => state.user);

  const showUserMenu = () => {
    setOpen(true);
  };

  const hideUserMenu = () => {
    setOpen(false);
  };

  return (
    <>
      <img
        src={profileImg ? profileImg : userIcon}
        alt="user image"
        className=" w-2rem"
        style={{ cursor: "pointer" }}
        onClick={showUserMenu}
      />
      <Drawer placement="right" open={open} onClose={hideUserMenu}>
        {userMenu.map((element, index) => {
          return (
            <div key={index} onClick={hideUserMenu}>
              {element.label}
            </div>
          );
        })}
      </Drawer>
    </>
  );
};
