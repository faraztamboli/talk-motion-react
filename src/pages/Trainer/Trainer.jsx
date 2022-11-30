import React from "react";
import { Row, Col, Card } from "antd";
import { ModelsDropdown } from "../../components/ui/ModelsDropdown";
import { TrainerControl } from "../../components/ui/TrainerControl";
import { GestureToVoice } from "../../components/ui/GestureToVoice";
import PageHeading from "../../components/Layout/PageHeading";
import JS2Py from "../../remotepyjs";

export default function Trainer(props) {
  return (
    <>
      {/* <PageHeading heading="Trainer" /> */}
      <div
        style={
          props.collapseWidth === 0
            ? { backgroundColor: "white", padding: 8 }
            : { backgroundColor: "white", padding: 24 }
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={8} xs={24} md={8}>
            <ModelsDropdown />
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="mt-8">
          <Col span={12} xs={24} md={12}>
            <Card>
              <GestureToVoice />
            </Card>
          </Col>
          <Col span={12} xs={24} md={12}>
            <Card>
              <TrainerControl />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}
