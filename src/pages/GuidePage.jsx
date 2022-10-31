import React from 'react';
import GuidePageContent from '../components/ui/GuidePageContent';
import GuidePageVideo from '../components/ui/GuidePageVideo';
import { Col, Row } from 'antd';
import Header from '../components/Layout/home/Header';

function GuidePage(props) {
  return (
    <>
      <Header md={props.md} />
      <div
        className="guide-page-container"
        style={{ backgroundColor: 'rgb(249 249 249)', paddingTop: '3rem' }}
      >
        <Row style={{ minHeight: '83vh' }} className="guide-page">
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
