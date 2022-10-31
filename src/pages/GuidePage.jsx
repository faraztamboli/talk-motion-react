import React from 'react';
import GuidePageContent from '../components/ui/GuidePageContent';
import GuidePageNavButtons from '../components/ui/GuidePageNavButtons';
import GuidePageVideo from '../components/ui/GuidePageVideo';
import { Col, Row } from 'antd';

function GuidePage(props) {
  return (
    <>
      <div className="guide-page-container" style={{ backgroundColor: 'rgb(249 249 249)' }}>
        <Row style={{ minHeight: '100vh' }} className="guide-page">
          <Col span={24}>
            <GuidePageNavButtons sm={props.sm} />
          </Col>
          <Col span={12} xs={24} lg={12}>
            <GuidePageVideo lg={props.lg} />
          </Col>
          <Col span={12} xs={24} lg={12}>
            <GuidePageContent sm={props.sm} lg={props.lg} />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default GuidePage;
