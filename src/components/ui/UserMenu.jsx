import React, { useState, useEffect } from "react";
import { Drawer, Avatar, Divider } from "antd";
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
  }, []);

  // check if the profile img is empty
  let pattern = /^null/;
  let isProfileImg = !pattern.test(profileImg);

  return (
    <>
      <div
        style={{
          cursor: "pointer",
          display: "inline-block",
          borderRadius: "50%",
          transition: "all var(--transition-base)",
          padding: "2px"
        }}
        onClick={showUserMenu}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-primary-light)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Avatar
          src={isProfileImg ? profileImg : userIcon}
          alt="user image"
          size={32}
        />
      </div>
      <Drawer
        title={
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            paddingBottom: "8px"
          }}>
            <Avatar
              src={isProfileImg ? profileImg : userIcon}
              size={48}
            />
            <div>
              <div style={{ 
                fontWeight: 600, 
                fontSize: "16px",
                color: "var(--color-neutral-900)"
              }}>
                Account
              </div>
              <div style={{ 
                fontSize: "14px",
                color: "var(--color-neutral-600)"
              }}>
                Manage your account
              </div>
            </div>
          </div>
        }
        placement="right"
        open={open}
        onClose={hideUserMenu}
        width={320}
        styles={{
          body: {
            padding: "16px 0"
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {userMenu.map((element, index) => {
            // Skip the user details item as it's now in the header
            if (element.key === "user_details") return null;
            
            return (
              <div key={element.key || index}>
                <div
                  onClick={hideUserMenu}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderRadius: "var(--radius-md)",
                    transition: "all var(--transition-base)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "var(--color-neutral-700)",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-neutral-100)";
                    e.currentTarget.style.color = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-neutral-700)";
                  }}
                >
                  {element.icon && (
                    <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>
                      {element.icon}
                    </span>
                  )}
                  {element.label}
                </div>
                {element.key === "setting" && <Divider style={{ margin: "8px 0" }} />}
              </div>
            );
          })}
        </div>
      </Drawer>
    </>
  );
};
