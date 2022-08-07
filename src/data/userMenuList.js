import { Link } from "react-router-dom";

const userMenu = [
  {
    key: "1",
    label: (
      <Link
        target="_blank"
        rel="noopener noreferrer"
        to="https://www.antgroup.com"
      >
        1st menu item
      </Link>
    ),
  },
  {
    key: "2",
    label: (
      <Link
        target="_blank"
        rel="noopener noreferrer"
        to="https://www.aliyun.com"
      >
        2nd menu item
      </Link>
    ),
  },
  {
    key: "3",
    label: (
      <Link
        target="_blank"
        rel="noopener noreferrer"
        to="https://www.luohanacademy.com"
      >
        3rd menu item
      </Link>
    ),
  },
];

export default userMenu;
