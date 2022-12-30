import React from "react";
import { Skeleton } from "antd";

function AuthPagesLoader() {
  const skeletonStyle = { padding: "24px", height: "90vh" };

  return (
    <div className="mh-100vh flex flex-center-center">
      <Skeleton
        active
        style={skeletonStyle}
        className="flex flex-center-center"
      />
      <Skeleton
        active
        style={skeletonStyle}
        className="flex flex-center-center"
      />
    </div>
  );
}

export default AuthPagesLoader;
