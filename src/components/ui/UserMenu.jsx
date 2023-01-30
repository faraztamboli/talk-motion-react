import { useState, useEffect } from "react";
import { Drawer } from "antd";
import { userMenu } from "../../data";
import { useSelector, useDispatch } from "react-redux";
import userIcon from "../../media/images/user-icon.jpg";
import useProfile from "../../hooks/useProfile";
import { setProfileImg } from "../../app/features/userSlice";

export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { profileImg } = useSelector((state) => state.user);
  const { getUserProfile } = useProfile();
  const dispatch = useDispatch();

  const showUserMenu = () => {
    setOpen(true);
  };

  const hideUserMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
      getUserProfile()
        .then((res) => {
          console.log(res);
          dispatch(setProfileImg(res.sm_img));
        })
        .catch((err) => console.log(err));
      // destructor for the component
      // return () => {};
  }, []);

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
