import React from 'react';
import { Dropdown, Menu } from 'antd';
import { userMenu } from '../../data';
import { useDispatch } from 'react-redux';
import { logout } from '../../app/features/loginSlice';

export const UserMenu = () => {
  const dispatch = useDispatch();

  // looks dangerous, but it's not.
  userMenu[3].onClick = () => {
    localStorage.setItem('isLoggedIn', false);
    localStorage.removeItem('token');
    dispatch(logout());
  };

  const menu = <Menu items={userMenu} />;
  return (
    <Dropdown className="circle" overlay={menu} placement="bottomRight" arrow>
      <img src="/media/avatars/150-2.jpg" alt="" className="circle w-2rem" />
    </Dropdown>
  );
};
