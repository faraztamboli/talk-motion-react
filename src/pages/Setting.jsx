import React from "react";
import Profile from "./Profile";
import UpdateProfile from "../components/ui/UpdateProfile";

function Setting() {
  return (
    <>
      <div className="layout-bg mh-100vh">
        <Profile from="setting" />
        <div className="flex flex-center-center">
          <UpdateProfile />
        </div>
      </div>
    </>
  );
}

export default Setting;
