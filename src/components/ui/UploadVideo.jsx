import React from "react";
import { Card, Col, Row } from "antd";
import UploadVideoURL from "./UploadVideoURL";
import UploadVideoFile from "./UploadVideoFile";
import RecordVideo from "./RecordVideo";

const UploadVideo = () => (
  <div className="container" style={{ minHeight: "100vh", marginTop: "2rem" }}>
    <Row gutter={16}>
      <Col span={8}>
        <Card title="Video URL" bordered={false} className="models-card">
          <p>Add a URL of a Sign Video</p>
          <UploadVideoURL />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Video File" bordered={false}>
          <p>Upload a Video File from your computer</p>
          <UploadVideoFile />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Record Video" bordered={false}>
          <p>Record a Video from the cam</p>
          <RecordVideo />
        </Card>
      </Col>
    </Row>
  </div>
);
export default UploadVideo;
