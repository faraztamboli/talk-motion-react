import { Link } from 'react-router-dom';
import { ContainerOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import UserMenuProfileItem from '../components/ui/UserMenuProfileItem';
import React from 'react';

const userMenu = [
  {
    key: 'user_details',
    label: (
      <Link to="/profile">
        <UserMenuProfileItem size="small" />
      </Link>
    ),
  },
  // {
  //   key: 'profile',
  //   label: (
  //     <Link to="/profile" style={{ fontSize: '1.1rem  ' }}>
  //       Profile
  //     </Link>
  //   ),
  //   icon: <UserOutlined style={{ fontSize: '1.1rem' }} />,
  // },
  {
    key: 'myModels',
    label: <Link to="/my-models">My Models</Link>,
    icon: <ContainerOutlined />,
    style: {
      paddingTop: '.8rem',
      paddingBottom: '.8rem',
    },
  },
  {
    key: 'settings',
    label: <Link to="/settings">Settings</Link>,
    icon: <SettingOutlined />,
    style: {
      paddingTop: '.8rem',
      paddingBottom: '.8rem',
    },
  },
  {
    key: 'logout',
    id: 'logout',
    label: 'Logout',
    icon: <LogoutOutlined />,
    style: {
      paddingTop: '.8rem',
      paddingBottom: '.8rem',
    },
  },
];

export default userMenu;
