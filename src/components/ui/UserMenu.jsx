import React from "react";
import { Button, Dropdown, Menu } from "antd";
import { userMenu } from "../../data";

export const UserMenu = () => {
  const menu = <Menu items={userMenu} />;
  return (
    <Dropdown className="circle" overlay={menu} placement="bottomRight" arrow>
      <img src="/media/avatars/150-2.jpg" alt="" className="circle w-2rem" />
    </Dropdown>
  );
};
