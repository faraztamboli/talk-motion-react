import React from "react";
import { Row, Col, Skeleton, Empty } from "antd";
import useModels from "../../hooks/useModels";
import NewModel from "../../components/ui/NewModel";
import { ModelsCard } from "../../components/ui/ModelsCard";
import UserMenuProfileItem from "../../components/ui/UserMenuProfileItem";

export default function Profile(props) {
  const { userModels, loading } = useModels();

  const profileStyle =
    props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  return (
    <>
      <div style={profileStyle} className="layout-bg mh-100vh">
        <div>
          <UserMenuProfileItem size="large" />
        </div>
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <h2>Your Models</h2>
          <Row gutter={[16, 16]}>
            {!loading && userModels?.length > 0
              ? userModels.map((model) => {
                  return (
                    <Col key={model.id} span={8} xs={24} md={8}>
                      <ModelsCard
                        model={model}
                        collapsedWidth={props.collapsedWidth}
                        key={model.key}
                      />
                    </Col>
                  );
                })
              : !loading && (
                  <div className="w-100p m-4">
                    <Empty
                      style={{ fontWeight: 500 }}
                      imageStyle={emptyImgStyle}
                      description={<span>No Models</span>}
                    />
                  </div>
                )}
            <Skeleton active loading={loading} style={{ width: "500px" }} />
          </Row>
          <div className="flex flex-center-center mt-10">
            <NewModel sm={props.sm} />
          </div>
        </div>
      </div>
    </>
  );
}
