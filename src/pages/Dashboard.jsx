import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Space, Button, Tag, Divider, Tabs, Switch } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  VideoCameraOutlined,
  TranslationOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import useUserRole from "../hooks/useUserRole";
import useProfile from "../hooks/useProfile";
import { useSelector } from "react-redux";
import useMessageApi from "../hooks/useMessageApi";

const { Title, Text, Paragraph } = Typography;

/**
 * Dashboard component with role-based navigation
 * Provides easy-to-use navigation cards for first-time users
 * Organized by user type: Students, Teachers, ASL Experts, Signers, etc.
 */
function Dashboard(props) {
  const { userRole, detectedRoles, setRole, loading: roleLoading } = useUserRole();
  const { getUserProfile } = useProfile();
  const [userProfile, setUserProfile] = useState(null);
  const [showSidebarHint, setShowSidebarHint] = useState(true);
  const [activeTab, setActiveTab] = useState("quick-access");
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();
  const collapsedWidth = props.collapsedWidth || 0;
  
  // Use default role if still loading - define early so it's available everywhere
  const currentRole = userRole || "student";

  useEffect(() => {
    loadUserProfile();
    // Check if user has seen sidebar hint before
    const hasSeenHint = localStorage.getItem("hasSeenSidebarHint");
    if (hasSeenHint === "true") {
      setShowSidebarHint(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  const handleRoleSelect = (role) => {
    setRole(role);
    showMessage("success", `Your role has been set to ${getRoleLabel(role)}`);
  };

  const dismissSidebarHint = () => {
    setShowSidebarHint(false);
    localStorage.setItem("hasSeenSidebarHint", "true");
  };

  const getRoleLabel = (role) => {
    const labels = {
      student: "Student",
      teacher: "Teacher",
      aslExpert: "ASL Expert",
      signer: "Signer/Content Creator",
      parent: "Parent/Guardian",
      admin: "Administrator",
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role) => {
    const icons = {
      student: <BookOutlined />,
      teacher: <TeamOutlined />,
      aslExpert: <UserOutlined />,
      signer: <VideoCameraOutlined />,
      parent: <UserOutlined />,
      admin: <SettingOutlined />,
    };
    return icons[role] || <UserOutlined />;
  };

  const style = (collapsedWidth || 0) === 0 ? { padding: 8 } : { padding: 24 };

  // Navigation cards organized by user type
  const studentFeatures = [
    {
      title: "Watch Videos",
      description: "Watch educational videos with sign language subtitles",
      icon: <PlayCircleOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/library",
      color: "#1890ff",
    },
    {
      title: "My Videos",
      description: "Access your saved and favorite videos",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/mylibrary",
      color: "#52c41a",
    },
    {
      title: "My Classrooms",
      description: "Join and access your classrooms",
      icon: <TeamOutlined style={{ fontSize: "32px" }} />,
      path: "/classrooms",
      color: "#722ed1",
    },
    {
      title: "My Courses",
      description: "Browse and study courses assigned to you",
      icon: <BookOutlined style={{ fontSize: "32px" }} />,
      path: "/courses",
      color: "#fa8c16",
    },
    {
      title: "Translator",
      description: "Convert between sign language and speech",
      icon: <TranslationOutlined style={{ fontSize: "32px" }} />,
      path: "/converter",
      color: "#eb2f96",
    },
  ];

  const teacherFeatures = [
    {
      title: "Create Subtitle Videos",
      description: "Record sign language gestures for educational videos",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/designer",
      color: "#1890ff",
    },
    {
      title: "Manage Classrooms",
      description: "Create and manage your classrooms",
      icon: <TeamOutlined style={{ fontSize: "32px" }} />,
      path: "/classrooms",
      color: "#52c41a",
    },
    {
      title: "Create Courses",
      description: "Organize content into courses for students",
      icon: <BookOutlined style={{ fontSize: "32px" }} />,
      path: "/courses",
      color: "#722ed1",
    },
    {
      title: "My Videos",
      description: "Manage your created video content",
      icon: <PlayCircleOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/mylibrary",
      color: "#fa8c16",
    },
    {
      title: "Translator",
      description: "Use sign-to-speech and speech-to-sign translation",
      icon: <TranslationOutlined style={{ fontSize: "32px" }} />,
      path: "/converter",
      color: "#eb2f96",
    },
    {
      title: "Staff Rooms",
      description: "Collaborate with other teachers and staff",
      icon: <TeamOutlined style={{ fontSize: "32px" }} />,
      path: "/staff-rooms",
      color: "#13c2c2",
    },
  ];

  const aslExpertFeatures = [
    {
      title: "Train Models",
      description: "Train AI models to recognize sign language",
      icon: <FileTextOutlined style={{ fontSize: "32px" }} />,
      path: "/trainer/train",
      color: "#1890ff",
    },
    {
      title: "Upload Training Data",
      description: "Upload gesture videos for model training",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/trainer/upload",
      color: "#52c41a",
    },
    {
      title: "Collect Data",
      description: "Collect and organize training data",
      icon: <FileTextOutlined style={{ fontSize: "32px" }} />,
      path: "/trainer/collect",
      color: "#722ed1",
    },
    {
      title: "My Models",
      description: "View and manage your trained models",
      icon: <FileTextOutlined style={{ fontSize: "32px" }} />,
      path: "/my-models",
      color: "#fa8c16",
    },
    {
      title: "Training Models",
      description: "Monitor models currently being trained",
      icon: <FileTextOutlined style={{ fontSize: "32px" }} />,
      path: "/models/training-models",
      color: "#eb2f96",
    },
    {
      title: "Create Subtitle Videos",
      description: "Create reference videos for model verification",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/designer",
      color: "#13c2c2",
    },
  ];

  const signerFeatures = [
    {
      title: "Create Subtitle Videos",
      description: "Record sign language gestures synchronized with videos",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/designer",
      color: "#1890ff",
    },
    {
      title: "My Video Library",
      description: "Manage your created video content",
      icon: <PlayCircleOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/mylibrary",
      color: "#52c41a",
    },
    {
      title: "Browse Videos",
      description: "Explore videos created by the community",
      icon: <VideoCameraOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/library",
      color: "#722ed1",
    },
    {
      title: "Translator",
      description: "Use sign-to-speech and speech-to-sign translation",
      icon: <TranslationOutlined style={{ fontSize: "32px" }} />,
      path: "/converter",
      color: "#fa8c16",
    },
  ];

  const allUserFeatures = [
    {
      title: "Translator",
      description: "Convert between sign language and speech in real-time",
      icon: <TranslationOutlined style={{ fontSize: "32px" }} />,
      path: "/converter",
      color: "#1890ff",
      forRoles: ["student", "teacher", "signer", "aslExpert"],
    },
    {
      title: "Watch Videos",
      description: "Watch videos with sign language subtitles",
      icon: <PlayCircleOutlined style={{ fontSize: "32px" }} />,
      path: "/video-subtitles/library",
      color: "#52c41a",
      forRoles: ["student", "teacher", "signer"],
    },
    {
      title: "Profile",
      description: "Manage your account settings and preferences",
      icon: <UserOutlined style={{ fontSize: "32px" }} />,
      path: "/profile",
      color: "#722ed1",
      forRoles: ["student", "teacher", "signer", "aslExpert"],
    },
    {
      title: "Settings",
      description: "Configure application settings",
      icon: <SettingOutlined style={{ fontSize: "32px" }} />,
      path: "/setting",
      color: "#fa8c16",
      forRoles: ["student", "teacher", "signer", "aslExpert"],
    },
  ];

  const getFeaturesForRole = (role) => {
    switch (role) {
      case "student":
        return studentFeatures;
      case "teacher":
        return teacherFeatures;
      case "aslExpert":
        return aslExpertFeatures;
      case "signer":
        return signerFeatures;
      default:
        return allUserFeatures.filter((f) => !f.forRoles || f.forRoles.includes(role));
    }
  };

  const renderFeatureCard = (feature) => (
    <Col key={feature.path} xs={24} sm={12} md={8} lg={6} xl={6}>
      <Link to={feature.path} style={{ textDecoration: "none" }}>
        <Card
          hoverable
          style={{
            height: "100%",
            borderRadius: "12px",
            transition: "all 0.3s ease",
            border: `2px solid ${feature.color}20`,
          }}
          bodyStyle={{ padding: "24px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = `0 8px 16px ${feature.color}30`;
            e.currentTarget.style.borderColor = feature.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            e.currentTarget.style.borderColor = `${feature.color}20`;
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: "100%", textAlign: "center" }}>
            <div style={{ color: feature.color }}>{feature.icon}</div>
            <Title level={4} style={{ margin: 0, color: feature.color }}>
              {feature.title}
            </Title>
            <Text type="secondary" style={{ fontSize: "14px", display: "block" }}>
              {feature.description}
            </Text>
          </Space>
        </Card>
      </Link>
    </Col>
  );

  const tabItems = [
    {
      key: "quick-access",
      label: "Quick Access",
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
            {getFeaturesForRole(currentRole).map(renderFeatureCard)}
        </Row>
      ),
    },
    {
      key: "all-features",
      label: "All Features",
      children: (
        <div>
          <Title level={3}>For Students</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: "32px" }}>
            {studentFeatures.map(renderFeatureCard)}
          </Row>
          <Divider />
          <Title level={3}>For Teachers</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: "32px" }}>
            {teacherFeatures.map(renderFeatureCard)}
          </Row>
          <Divider />
          <Title level={3}>For ASL Experts</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: "32px" }}>
            {aslExpertFeatures.map(renderFeatureCard)}
          </Row>
          <Divider />
          <Title level={3}>For Signers & Content Creators</Title>
          <Row gutter={[16, 16]}>
            {signerFeatures.map(renderFeatureCard)}
          </Row>
        </div>
      ),
    },
  ];

  // Show loading only for a short time, then show dashboard with default role
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Show loading for max 2 seconds, then show dashboard
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    
    // If role loading completes, stop showing loading
    if (!roleLoading) {
      setShowLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [roleLoading]);

  if (showLoading && roleLoading) {
    return (
      <div style={style} className="layout-bg mh-100vh">
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Text>Loading...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={style} className="layout-bg mh-100vh">
      {contextHolder}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: "32px" }}>
          <Title level={2} style={{ marginBottom: "8px" }}>
            Welcome{userProfile?.first ? `, ${userProfile.first}` : ""}!
          </Title>
          <Paragraph type="secondary" style={{ fontSize: "16px", marginBottom: "16px" }}>
            Choose your role to see personalized features, or explore all available tools below.
          </Paragraph>

          {/* Role Selection */}
          <Space wrap size="middle" style={{ marginBottom: "16px" }}>
            <Text strong>I am a:</Text>
            {["student", "teacher", "aslExpert", "signer"].map((role) => (
              <Button
                key={role}
                type={currentRole === role ? "primary" : "default"}
                icon={getRoleIcon(role)}
                onClick={() => handleRoleSelect(role)}
                size="large"
              >
                {getRoleLabel(role)}
              </Button>
            ))}
          </Space>

          {currentRole && (
            <div style={{ marginTop: "16px" }}>
              <Tag color="blue" style={{ fontSize: "14px", padding: "4px 12px" }}>
                Current Role: {getRoleLabel(currentRole)}
              </Tag>
              {detectedRoles.length > 1 && (
                <Tag color="green" style={{ fontSize: "14px", padding: "4px 12px", marginLeft: "8px" }}>
                  Also detected as: {detectedRoles.filter((r) => r !== currentRole).map(getRoleLabel).join(", ")}
                </Tag>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Hint */}
        {showSidebarHint && (collapsedWidth || 0) > 0 && (
          <Card
            type="inner"
            style={{
              marginBottom: "24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <MenuOutlined style={{ fontSize: "20px" }} />
                  <div>
                    <Text strong style={{ color: "white", fontSize: "16px", display: "block" }}>
                      Expert Tip: Use the Sidebar Menu
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
                      Once you're familiar with the system, use the sidebar menu (☰) for quick navigation to all features.
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={dismissSidebarHint}
                  style={{ color: "white" }}
                  aria-label="Dismiss hint"
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Main Navigation Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </div>
  );
}

export default Dashboard;

