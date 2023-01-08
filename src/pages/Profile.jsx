import React from "react";
import { Descriptions } from "antd";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import MetaDecorator from "../components/MetaDecorator";
import { profileDetails } from "../data/PageDetails";
import useProfile from "../hooks/useProfile";
import { useEffect } from "react";

export default function Profile(props) {
  const { getUserProfile, userProfile } = useProfile();

  useEffect(() => {
    getUserProfile();
  }, []);

  console.log(userProfile);

  const profileStyle =
    props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };

  const { title, description } = profileDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div
        style={profileStyle}
        className={
          props.from === "setting" ? "layout-bg" : "layout-bg mh-100vh"
        }
      >
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
            <Descriptions.Item label="Country" span={2}>
              {userProfile?.country}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </>
  );
}
