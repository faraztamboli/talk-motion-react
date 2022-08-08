import { Link } from "react-router-dom";

const userMenu = [
  {
    key: "profile",
    label: (
      <Link rel="noopener noreferrer" to="/profile">
        Profile
      </Link>
    ),
  },
  {
    key: "myModels",
    label: (
      <Link rel="noopener noreferrer" to="/settings">
        My Models
      </Link>
    ),
  },
  {
    key: "settings",
    label: (
      <Link rel="noopener noreferrer" to="/settings">
        Settings
      </Link>
    ),
  },
  {
    key: "logout",
    label: (
      <Link rel="noopener noreferrer" to="/logout">
        Logout
      </Link>
    ),
  },
];

export default userMenu;
