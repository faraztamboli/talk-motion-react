import React from 'react';
import { Row, Col } from 'antd';
import modelsData from '../data/modelsData';
import { ModelsCard } from '../components/ui/ModelsCard';
import UserMenuProfileItem from '../components/ui/UserMenuProfileItem';

export default function Profile(props) {
  return (
    <>
      <div
        style={
          props.collapseWidth === 0
            ? { backgroundColor: 'white', padding: 8 }
            : { backgroundColor: 'white', padding: 24 }
        }
      >
        <div>
          <UserMenuProfileItem size="large" />
        </div>
        <div className="details_section" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontWeight: 'bold', color: 'gray' }}>Your Models</h2>
          <Row gutter={[16, 16]}>
            {modelsData.map((model, index) => {
              return (
                <Col key={index * 2}>
                  <ModelsCard model={model} />
                </Col>
              );
            })}
          </Row>
        </div>
      </div>
    </>
  );
}
