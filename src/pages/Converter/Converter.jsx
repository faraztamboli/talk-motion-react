import React from 'react';
import { Row, Col, Card } from 'antd';
import { ModelsDropdown } from '../../components/ui/ModelsDropdown';
import { VoicesDropdown } from '../../components/ui/VoicesDropdown';
import { VoiceToGesture } from '../../components/ui/VoiceToGesture';
import { GestureToVoice } from '../../components/ui/GestureToVoice';
import PageHeading from '../../components/Layout/PageHeading';

const Converter = props => {
  return (
    <>
      <PageHeading heading="Converter" />
      <div
        style={
          props.collapseWidth === 0
            ? { backgroundColor: 'white', padding: 8 }
            : { backgroundColor: 'white', padding: 24 }
        }
      >
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
            <Card>
              <VoiceToGesture />
            </Card>
          </Col>
          <Col span={12} xs={24} md={12}>
            <Card>
              <GestureToVoice />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Converter;
