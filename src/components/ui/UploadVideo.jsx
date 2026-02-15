import React from "react";
import { Card, Col, Row, Typography, Space } from "antd";
import { 
  LinkOutlined, 
  UploadOutlined, 
  VideoCameraOutlined,
  AppstoreOutlined 
} from "@ant-design/icons";
import UploadVideoURL from "./UploadVideoURL";
import UploadVideoFile from "./UploadVideoFile";
import RecordVideo from "./RecordVideo";
import { ModelsDropdown } from "./ModelsDropdown";
import useMessageApi from "../../hooks/useMessageApi";

const { Title, Text } = Typography;

const UploadVideo = () => {
  const { contextHolder, showMessage } = useMessageApi();
  return (
    <>
      {contextHolder}
      <div
        className="container"
        style={{ 
          minHeight: "100vh", 
          padding: "var(--spacing-xl)"
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <Title level={2} style={{ margin: 0, marginBottom: "var(--spacing-xs)" }}>
            Upload Training Videos
          </Title>
          <Text type="secondary" style={{ fontSize: "var(--font-size-base)" }}>
            Add videos to train your gesture recognition model. Choose from URL, file upload, or camera recording.
          </Text>
        </div>

        {/* Model Selection */}
        <Card 
          style={{ 
            marginBottom: "var(--spacing-xl)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Space>
              <AppstoreOutlined style={{ fontSize: "18px", color: "var(--color-primary)" }} />
              <Text strong>Select Model</Text>
            </Space>
            <ModelsDropdown from="trainer" />
          </Space>
        </Card>

        {/* Upload Options */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={8}>
            <Card 
              hoverable
              bordered={false}
              className="models-card"
              style={{
                height: "100%",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
              }}
              bodyStyle={{ padding: "var(--spacing-xl)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Space size="middle" style={{ marginBottom: "var(--spacing-md)" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LinkOutlined style={{ fontSize: "24px", color: "var(--color-primary)" }} />
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      Video URL
                    </Title>
                  </Space>
                  <Text type="secondary" style={{ display: "block", marginTop: "var(--spacing-xs)" }}>
                    Add a URL of a sign language video from YouTube or other platforms
                  </Text>
                </div>
                <UploadVideoURL showMessage={showMessage} />
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card 
              hoverable
              bordered={false}
              style={{
                height: "100%",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
              }}
              bodyStyle={{ padding: "var(--spacing-xl)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Space size="middle" style={{ marginBottom: "var(--spacing-md)" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-success-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UploadOutlined style={{ fontSize: "24px", color: "var(--color-success)" }} />
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      Video File
                    </Title>
                  </Space>
                  <Text type="secondary" style={{ display: "block", marginTop: "var(--spacing-xs)" }}>
                    Upload a video file from your computer (MP4, MOV, AVI, etc.)
                  </Text>
                </div>
                <UploadVideoFile showMessage={showMessage} />
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card 
              hoverable
              bordered={false}
              style={{
                height: "100%",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
              }}
              bodyStyle={{ padding: "var(--spacing-xl)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Space size="middle" style={{ marginBottom: "var(--spacing-md)" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-warning-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <VideoCameraOutlined style={{ fontSize: "24px", color: "var(--color-warning)" }} />
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      Record Video
                    </Title>
                  </Space>
                  <Text type="secondary" style={{ display: "block", marginTop: "var(--spacing-xs)" }}>
                    Record a sign language video directly from your camera
                  </Text>
                </div>
                <RecordVideo showMessage={showMessage} />
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};
export default UploadVideo;
