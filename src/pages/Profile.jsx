import React from 'react';
import { Progress, Row, Col, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { modelsData } from '../data';
import { ModelsCard } from '../components/ui/ModelsCard';
import UserMenuProfileItem from '../components/ui/UserMenuProfileItem';

export default function Profile() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <UserMenuProfileItem size="large" />
        <div
          className=""
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Progress type="circle" percent={100} width={50} />
          <p style={{ marginTop: '.6rem', lineHeight: '20px', color: 'rgb(161, 165, 183)' }}>
            100% profile completed
          </p>
          <Button type="primary" ghost={false} icon={<EditOutlined />} shape="round">
            Edit Details
          </Button>
        </div>
      </div>
      <div className="details_section" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontWeight: 'bold', color: 'gray' }}>Your Models</h2>
        <Row gutter={[16, 16]}>
          {modelsData.map(model => {
            return (
              <Col>
                <ModelsCard model={model} key={model.key} />
              </Col>
            );
          })}
        </Row>
      </div>
    </>
  );
}
