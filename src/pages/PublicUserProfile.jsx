import React, { useState, useEffect } from "react";
import { Avatar, Col, Descriptions, Empty, Image, Row, Skeleton } from "antd";
import MetaDecorator from "../components/MetaDecorator";
import { profileDetails } from "../data/PageDetails";
import useProfile from "../hooks/useProfile";
import useMessageApi from "../hooks/useMessageApi";
import { useParams } from "react-router-dom";
import { ModelsCard } from "../components/ui/ModelsCard";
import useModels from "../hooks/useModels";

export default function Profile(props) {
  const [loading, setLoading] = useState(true);
  const [userModels, setUserModels] = useState([]);
  const [userProfile, setUserProfile] = useState();
  const { getUserInfo } = useProfile();
  const { getUsersModelsByUserName } = useModels();
  const { contextHolder } = useMessageApi();

  const { username } = useParams();

  useEffect(() => {
    getUserInfo("testuser4")
      .then((res) => {
        console.log(res);
        setUserProfile(res);
      })
      .catch((err) => {
        console.log(err);
      });

    getUsersModelsByUserName("testuser4", "", 0, 9999)
      .then((res) => {
        console.log(res);
        setLoading(false);
        setUserModels(res[0]);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
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
          <div
            className="menu-content d-flex align-items-center px-3 w-100p"
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: ".5rem",
            }}
          >
            <div
              className="symbol symbol-50px me-5 flex flex-column flex-center-center"
              style={{ marginRight: "1rem" }}
            >
              <Avatar
                src={<Image src={userProfile?.sm_img} />}
                size={
                  props.size === "small"
                    ? { xs: 32, sm: 42, md: 45, lg: 48, xl: 50, xxl: 55 }
                    : { xs: 42, sm: 72, md: 80, lg: 92, xl: 95, xxl: 100 }
                }
              />
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
        </div>
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <Descriptions
            layout="horizontal"
            column={1}
            bordered
            labelStyle={{ backgroundColor: "whitesmoke" }}
          >
            <Descriptions.Item label="First name">
              {userProfile?.first}
            </Descriptions.Item>
            <Descriptions.Item label="Middle name">
              {userProfile?.middle}
            </Descriptions.Item>
            <Descriptions.Item label="Last name">
              {userProfile?.last}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="mt-9">
          <h2>User Models</h2>
          <Row gutter={[16, 16]}>
            {!loading && userModels?.length > 0 ? (
              userModels.map((model) => {
                return (
                  <Col key={model.id} span={8} xs={24} md={8}>
                    <ModelsCard
                      model={model}
                      collapsedWidth={props.collapsedWidth}
                      key={model.key}
                      // addNewTrainer={addNewTrainer}
                      loading={loading}
                      setLoading={setLoading}
                      // deleteModel={deleteModel}
                      // showMessage={showMessage}
                      // purchaseModel={purchaseModel}
                      // cloneModel={cloneModel}
                    />
                  </Col>
                );
              })
            ) : (
              <div className="w-100p m-4">
                <Empty
                  style={{ fontWeight: 500 }}
                  description={<span>No Models</span>}
                />
              </div>
            )}
            <Skeleton active loading={loading} style={{ width: "500px" }} />
          </Row>
        </div>
      </div>
    </>
  );
}
