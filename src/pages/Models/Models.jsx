import React from "react";
import { Row, Col } from "antd";
// import { modelsData } from "../../data";
import NewModel from "../../components/ui/NewModel";
import { ModelsCard } from "../../components/ui/ModelsCard";
import useModels from "../../hooks/useModels";

export default function Models(props) {
  const { publicModels, userModels, loading } = useModels();

  const modelStyle = props.sm
    ? { backgroundColor: "#E5E5E5", padding: "15px", minHeight: "100vh" }
    : { backgroundColor: "#E5E5E5", padding: "24px", minHeight: "100vh" };

  return (
    <>
      <div style={modelStyle}>
        <h2>Public Models</h2>
        <Row gutter={[16, 16]} style={{ marginBottom: "3rem" }}>
          {loading !== true
            ? publicModels
              ? publicModels.map((model) => {
                  return (
                    <Col key={model.model_id} span={8} xs={24} md={8}>
                      <ModelsCard model={model} key={model.key} />
                    </Col>
                  );
                })
              : "No public models to show"
            : "Loading"}
        </Row>

        <h2>Your Models</h2>
        <Row gutter={[16, 16]}>
          {loading !== true
            ? userModels
              ? userModels.map((model) => {
                  return (
                    <Col key={model.model_id} span={8} xs={24} md={8}>
                      <ModelsCard
                        model={model}
                        collapsedWidth={props.collapsedWidth}
                        key={model.key}
                      />
                    </Col>
                  );
                })
              : "No user Models to show"
            : "Loading"}
        </Row>
        <div className="flex flex-center-center mt-10">
          <NewModel sm={props.sm} />
        </div>
      </div>
    </>
  );
}
