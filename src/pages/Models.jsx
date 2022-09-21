import React from 'react';
import { Row, Col } from 'antd';
import { modelsData } from '../data';
import { ModelsCard } from '../components/ui/ModelsCard';

export default function Models() {
  return (
    <div>
      <h2 style={{ fontWeight: 'bold' }}>Models</h2>
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
  );
}
