import React from "react";
import { Row, Col, Skeleton, Empty } from "antd";
import NewModel from "../../components/ui/NewModel";
import { ModelsCard } from "../../components/ui/ModelsCard";
import useModels from "../../hooks/useModels";

export default function Models(props) {
  const { publicModels, userModels, loading } = useModels();

  const modelStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  return (
    <>
      <div style={modelStyle} className="layout-bg mh-100vh">
        <h2>Public Models</h2>
        <Row gutter={[16, 16]} style={{ marginBottom: "3rem" }}>
          {!loading && publicModels?.length > 0
            ? publicModels.map((model) => {
                return (
                  <Col key={model.id} span={8} xs={24} md={8}>
                    <ModelsCard model={model} key={model.key} />
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
    </>
  );
}
