import { Avatar, Tooltip } from "antd";
import React from "react";

function UserInfoImage({ image, username }) {
  return (
    <div className="h-100p">
      <Tooltip title={username}>
        <Avatar src={image} size="large" />
      </Tooltip>
    </div>
  );
}

export default UserInfoImage;
