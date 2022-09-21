import React from 'react';
import { Row, Col, Card } from 'antd';
import { ModelsDropdown } from '../components/ui/ModelsDropdown';
import { VoicesDropdown } from '../components/ui/VoicesDropdown';
import { VoiceToGesture } from '../components/ui/VoiceToGesture';
import { GestureToVoice } from '../components/ui/GestureToVoice';

export default function Converter() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <ModelsDropdown />
        </Col>
        <Col span={8}></Col>
        <Col span={8}>
          <VoicesDropdown />
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-8">
        <Col span={12}>
          <Card>
            <VoiceToGesture />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <GestureToVoice />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
