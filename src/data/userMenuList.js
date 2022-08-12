import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../app/features/loginSlice';

const userMenu = [
  {
    key: 'profile',
    label: (
      <Link rel="noopener noreferrer" to="/profile">
        Profile
      </Link>
    ),
  },
  {
    key: 'myModels',
    label: (
      <Link rel="noopener noreferrer" to="/settings">
        My Models
      </Link>
    ),
  },
  {
    key: 'settings',
    label: (
      <Link rel="noopener noreferrer" to="/settings">
        Settings
      </Link>
    ),
  },
  {
    key: 'logout',
    label: 'Logout',
    onClick: () => {
      localStorage.setItem('isLoggedIn', false);
      localStorage.removeItem('token');
      window.location.reload();
    },
  },
];

export default userMenu;
