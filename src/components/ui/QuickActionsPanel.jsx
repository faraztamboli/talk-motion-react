import React from "react";
import { Card, Button, Space, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import {
  VideoCameraOutlined,
  TeamOutlined,
  BookOutlined,
  TranslationOutlined,
  UploadOutlined,
  UserAddOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useFlags } from "../../hooks/useFlag";

const quickActions = [
  {
    key: "start-conversation",
    label: "Start a Conversation",
    icon: <MessageOutlined />,
    path: "/conversation",
    color: "#1677ff",
    flag: "conversation_v2",
  },
  {
    key: "start-recording",
    label: "Start Recording",
    icon: <VideoCameraOutlined />,
    path: "/video-subtitles/designer",
    color: "#1890ff",
  },
  {
    key: "browse-classrooms",
    label: "Browse Classrooms",
    icon: <TeamOutlined />,
    path: "/classrooms",
    color: "#52c41a",
  },
  {
    key: "my-courses",
    label: "My Courses",
    icon: <BookOutlined />,
    path: "/courses",
    color: "#722ed1",
  },
  {
    key: "voice-to-gesture",
    label: "Voice to Gesture",
    icon: <TranslationOutlined />,
    path: "/converter",
    color: "#fa8c16",
  },
  {
    key: "upload-video",
    label: "Upload Video",
    icon: <UploadOutlined />,
    path: "/models",
    color: "#eb2f96",
    flag: "legacy_models_visible",
  },
  {
    key: "find-collaborators",
    label: "Find Collaborators",
    icon: <UserAddOutlined />,
    path: "/classrooms", // TODO: Update when collaboration feature is ready
    color: "#13c2c2",
  },
];

export const QuickActionsPanel = ({ sm }) => {
  const navigate = useNavigate();
  const flags = useFlags();
  const actions = quickActions.filter((action) => !action.flag || flags[action.flag]);

  return (
    <Card
      title="Quick Actions"
      style={{ height: "100%" }}
      bodyStyle={{ padding: sm ? "12px" : "16px" }}
    >
      <Row gutter={[8, 8]}>
        {actions.map((action) => (
          <Col key={action.key} xs={24} sm={12} md={8}>
            <Button
              type="primary"
              icon={action.icon}
              block
              size="large"
              onClick={() => navigate(action.path)}
              style={{
                backgroundColor: action.color,
                borderColor: action.color,
                height: "auto",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = action.color;
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = action.color;
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {action.label}
            </Button>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActionsPanel;

