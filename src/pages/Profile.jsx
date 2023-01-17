import React, { useState } from "react";
import { Descriptions } from "antd";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import MetaDecorator from "../components/MetaDecorator";
import { profileDetails } from "../data/PageDetails";
import useProfile from "../hooks/useProfile";
import { useEffect } from "react";
import useMessageApi from "../hooks/useMessageApi";
import { useDispatch } from "react-redux";
import { setProfileImg } from "../app/features/userSlice";

export default function Profile(props) {
  const [userProfile, setUserProfile] = useState();
  const { getUserProfile } = useProfile();
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  useEffect(() => {
    getUserProfile()
      .then((res) => {
        setUserProfile(res);
        dispatch(setProfileImg(res.sm_img));
      })
      .catch((err) => console.log(err));
  }, []);

  const profileStyle =
    props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  const { title, description } = profileDetails;
  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={profileStyle} className="layout-bg mh-100vh">
        <div>
          <UserMenuProfileItem
            size="large"
            showMessage={showMessage}
            setUserProfile={setUserProfile}
          />
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
