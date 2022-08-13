import { Link } from 'react-router-dom';

const userMenu = [
  {
    key: 'profile',
    label: <Link to="/profile">Profile</Link>,
  },
  {
    key: 'myModels',
    label: <Link to="/my-models">My Models</Link>,
  },
  {
    key: 'settings',
    label: <Link to="/settings">Settings</Link>,
  },
  {
    key: 'logout',
    id: 'logout',
    label: 'Logout',
  },
];

export default userMenu;
