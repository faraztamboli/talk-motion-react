import React, { useState, useEffect } from "react";
import { Descriptions, Card, Divider } from "antd";
import UpdateProfile from "../components/ui/UpdateProfile";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import LanguageSelector from "../components/ui/LanguageSelector";
import AIPreferences from "../components/ui/AIPreferences";
import useProfile from "../hooks/useProfile";
import { useLanguage } from "../contexts/LanguageContext";

function Setting(props) {
  const [userProfile, setUserProfile] = useState();
  const { getUserProfile } = useProfile();
  const { getCurrentLanguage } = useLanguage();

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
        <Divider />
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <Card 
            title="Language Preferences" 
            style={{ 
              maxWidth: "600px",
              margin: "0 auto",
              marginBottom: "2rem"
            }}
          >
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px",
              padding: "8px 0"
            }}>
              <div>
                <p style={{ 
                  marginBottom: "12px",
                  color: "var(--color-neutral-700)",
                  fontSize: "14px"
                }}>
                  Select your preferred language for the application interface:
                </p>
                <LanguageSelector 
                  size="large" 
                  showLabel={true}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ 
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "var(--color-neutral-50)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "var(--color-neutral-600)"
              }}>
                <strong>Current Language:</strong> {getCurrentLanguage().nativeName || getCurrentLanguage().name}
              </div>
            </div>
          </Card>
        </div>

        <Divider />
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <AIPreferences 
            style={{ 
              maxWidth: "800px",
              margin: "0 auto"
            }}
          />
        </div>
      </div>
    </>
  );
}

export default Setting;
