import React from 'react';
import { Row, Col } from 'antd';
import { modelsData } from '../data';
import { ModelsCard } from '../components/ui/ModelsCard';

export default function Models() {
  console.log(modelsData);
  return (
    <div>
      <h1>Models</h1>
      <Row gutter={[16, 16]}>
        {modelsData.map(model => {
          return (
            <Col>
              <ModelsCard model={model} />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
