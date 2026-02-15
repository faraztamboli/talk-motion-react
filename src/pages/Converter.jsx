import React, { useState } from "react";
import { Row, Col, Card, Alert, Button, Popover } from "antd";
import { InfoCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import MetaDecorator from "../components/MetaDecorator";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { VoicesDropdown } from "../components/ui/VoicesDropdown";
import { VoiceToGesture } from "../components/ui/VoiceToGesture";
import { GestureToVoice } from "../components/ui/GestureToVoice";
import { converterDetails } from "../data/PageDetails";

const Converter = (props) => {
  const [showAccessibilityInfo, setShowAccessibilityInfo] = useState(false);
  const cardBodyStyle = props.sm ? { padding: "5px" } : null;

  const { title, description } = converterDetails;

  const accessibilityContent = (
    <div style={{ maxWidth: 400 }}>
      <Alert
        message="Accessibility Features"
        description="This page is optimized for Deaf and non-speaking users. All actions provide clear visual feedback, and status updates are displayed as text."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        onClose={() => setShowAccessibilityInfo(false)}
        aria-live="polite"
      />
    </div>
  );

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div className="converter-content layout-bg mh-100vh" role="main" aria-label="Voice and Gesture Converter">
        {/* Help Button with Accessibility Info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-xs)' }}>
          <Popover
            content={accessibilityContent}
            title="Accessibility Information"
            trigger="click"
            open={showAccessibilityInfo}
            onOpenChange={setShowAccessibilityInfo}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              aria-label="Show accessibility information"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Help
            </Button>
          </Popover>
        </div>

        <Row gutter={[12, 8]} role="toolbar" aria-label="Model and voice selection" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <Col span={8} xs={24} md={8}>
            <div role="group" aria-label="Select model">
              <ModelsDropdown from="converter" />
            </div>
          </Col>
          <Col span={8} xs={0} md={8} aria-hidden="true"></Col>
          <Col span={8} xs={24} md={8}>
            <div role="group" aria-label="Select voice">
              <VoicesDropdown />
            </div>
          </Col>
        </Row>
        <Row gutter={[16, 16]} role="region" aria-label="Translation panels" style={{ flex: 1, minHeight: 0 }}>
          <Col span={12} xs={24} md={12}>
            <Card 
              className="converter-cards converter-card-voice-to-gesture" 
              bodyStyle={cardBodyStyle} 
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              role="region"
              aria-label="Voice to Gesture translation panel"
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <VoiceToGesture sm={props.sm} md={props.md} />
              </div>
            </Card>
          </Col>
          <Col span={12} xs={24} md={12}>
            <Card 
              className="converter-cards converter-card-gesture-to-voice" 
              bodyStyle={cardBodyStyle} 
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              role="region"
              aria-label="Gesture to Voice translation panel"
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <GestureToVoice from="converter" />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Converter;
