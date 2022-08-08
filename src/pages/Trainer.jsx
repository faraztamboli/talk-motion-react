import React from 'react';
import { Row, Col, Card } from 'antd';
import { ModelsDropdown } from '../components/ui/ModelsDropdown';
import { TrainerControl } from '../components/ui/TrainerControl';
import { GestureToVoice } from '../components/ui/GestureToVoice';

export default function Trainer() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <ModelsDropdown />
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-8">
        <Col span={12}>
          <Card>
            <GestureToVoice />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <TrainerControl />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
