import React from "react";
import { Row, Col } from "antd";
import { modelsData } from "../../data";
import { ModelsCard } from "../../components/ui/ModelsCard";
import PageHeading from "../../components/Layout/PageHeading";

export default function Models(props) {
  return (
    <>
      {/* <PageHeading heading="Models" /> */}
      <div
        style={
          props.collapseWidth === 0
            ? { backgroundColor: "#E5E5E5", padding: 8 }
            : { backgroundColor: "#E5E5E5", padding: 24 }
        }
      >
        <Row gutter={[16, 16]}>
          {modelsData.map((model) => {
            return (
              <Col key={model.key} span={8}>
                <ModelsCard
                  model={model}
                  collapsedWidth={props.collapsedWidth}
                  key={model.key}
                />
              </Col>
            );
          })}
        </Row>
      </div>
    </>
  );
}
