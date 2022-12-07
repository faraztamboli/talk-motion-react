import React from "react";
import { Row, Col, Card } from "antd";
import { ModelsDropdown } from "../../components/ui/ModelsDropdown";
import { VoicesDropdown } from "../../components/ui/VoicesDropdown";
import { VoiceToGesture } from "../../components/ui/VoiceToGesture";
import { GestureToVoice } from "../../components/ui/GestureToVoice";

const Converter = (props) => {
  const cardBodyStyle = props.sm ? { padding: "5px" } : null;
  return (
    <>
      <div className="converter-content">
        <Row gutter={[16, 16]}>
          <Col span={8} xs={24} md={8}>
            <ModelsDropdown />
          </Col>
          <Col span={8} xs={0} md={8}></Col>
          <Col span={8} xs={24} md={8}>
            <VoicesDropdown />
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="mt-8">
          <Col span={12} xs={24} md={12}>
            <Card className="converter-cards" bodyStyle={cardBodyStyle}>
              <VoiceToGesture sm={props.sm} md={props.md} />
            </Card>
          </Col>
          <Col span={12} xs={24} md={12}>
            <Card className="converter-cards" bodyStyle={cardBodyStyle}>
              <GestureToVoice from="converter" />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Converter;
