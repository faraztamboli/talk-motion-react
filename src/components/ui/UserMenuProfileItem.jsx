import React from "react";
import { Avatar, Button, Image } from "antd";
import { useSelector } from "react-redux";
import { MdCameraAlt } from "react-icons/md";
import Upload from "antd/es/upload/Upload";
import useProfile from "../../hooks/useProfile";

export default function UserMenuProfileItem(props) {
  const { uploadProfilePic } = useProfile();
  const username = useSelector((state) => state.user.username);
  const name = useSelector((state) => state.user.name);

  const uploadProps = {
    name: "uploadpic",
    async onChange(info) {
      console.log(info);
      uploadProfilePic(info.fileList[0].originFileObj);
    },
  };

  return (
    <>
      <div
        className="menu-content d-flex align-items-center px-3 w-100p"
        style={{ display: "flex", alignItems: "center", marginBottom: ".5rem" }}
      >
        <div
          className="symbol symbol-50px me-5 flex flex-column flex-center-center"
          style={{ marginRight: "1rem" }}
        >
          <Avatar
            src={<Image src="/media/avatars/150-2.jpg" />}
            size={
              props.size === "small"
                ? { xs: 32, sm: 42, md: 45, lg: 48, xl: 50, xxl: 55 }
                : { xs: 42, sm: 72, md: 80, lg: 92, xl: 95, xxl: 100 }
            }
          />
          {props.from === "drawer" ? null : (
            <Upload {...uploadProps}>
              <Button
                className="mt-1 layout-bg"
                size="small"
                icon={<MdCameraAlt color="gray" size={20} />}
              />
            </Upload>
          )}
        </div>
        <div className="d-flex flex-column">
          <div
            className="fw-border d-flex align-items-center fs-5"
            style={{
              fontWeight: "bolder",
              fontSize: "larger",
              color: "#a1a5b7",
            }}
          >
            {name ? name?.toUpperCase() : "Talk Motion User"}
            <span
              className="badge badge-light-success fw-border fs-8 px-2 py-1 ms-2"
              style={{
                backgroundColor: "#e8fff3",
                color: "#50cd89",
                fontWeight: "bold",
                fontSize: "small",
                marginLeft: ".4rem ",
                padding: "3px 4px",
                verticalAlign: "top",
                borderRadius: "10px",
              }}
            >
              pro
            </span>
          </div>
          <p
            href="/"
            className="fw-bold text-muted text-hover-primary fs-7"
            style={{ color: "#a1a5b7", margin: 0 }}
          >
            {username ? username : "talkmotionuser"}
          </p>
        </div>
      </div>
    </>
  );
}
