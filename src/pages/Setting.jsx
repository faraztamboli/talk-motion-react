import React, { useState, useEffect } from "react";
import { Descriptions } from "antd";
import UpdateProfile from "../components/ui/UpdateProfile";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import useProfile from "../hooks/useProfile";

function Setting(props) {
  const [userProfile, setUserProfile] = useState();
  const { getUserProfile } = useProfile();

  useEffect(() => {
    getUserProfile()
      .then((res) => {
        console.log(res);
        setUserProfile(res);
      })
      .catch((err) => console.log(err));
  }, []);

  const style = props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };

  return (
    <>
      <div style={style} className="layout-bg mh-100vh">
        <div>
          <UserMenuProfileItem size="large" />
        </div>
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <Descriptions
            layout="horizontal"
            column={1}
            bordered
            labelStyle={{ backgroundColor: "whitesmoke" }}
          >
            <Descriptions.Item label="Username">
              {userProfile?.username}
            </Descriptions.Item>
            <Descriptions.Item label="Full Name">
              {userProfile?.fullname}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {userProfile?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Street">
              {userProfile?.street}
            </Descriptions.Item>
            <Descriptions.Item label="City">
              {userProfile?.city}
            </Descriptions.Item>
            <Descriptions.Item label="Country">
              {userProfile?.country}
            </Descriptions.Item>
          </Descriptions>
        </div>
        <div className="flex flex-center-center mt-6">
          <UpdateProfile userProfile={userProfile} />
        </div>
      </div>
    </>
  );
}

export default Setting;
