import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Space, Skeleton, Divider } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useProfile from "../hooks/useProfile";
import useDashboard from "../hooks/useDashboard";
import useMessageApi from "../hooks/useMessageApi";
import { DashboardStatsCard } from "../components/ui/DashboardStatsCard";
import QuickActionsPanel from "../components/ui/QuickActionsPanel";
import ActivityFeedWidget from "../components/ui/ActivityFeedWidget";
import NotificationsPanel from "../components/ui/NotificationsPanel";
import LearningProgressWidget from "../components/ui/LearningProgressWidget";
import ActiveClassroomsWidget from "../components/ui/ActiveClassroomsWidget";
import RecentVideosWidget from "../components/ui/RecentVideosWidget";
import CommunitySpotlightWidget from "../components/ui/CommunitySpotlightWidget";
import AIRecommendations from "../components/ui/AIRecommendations";
import AILearningInsights from "../components/ui/AILearningInsights";
import MetaDecorator from "../components/MetaDecorator";

const { Title, Text } = Typography;

/**
 * Interactive Dashboard for Deaf Community Collaboration
 * Features:
 * - Quick stats overview
 * - Quick actions panel
 * - Activity feed
 * - Notifications
 * - Learning progress
 * - Active classrooms
 * - Recent videos
 * - Community spotlight
 */
function DashboardNew(props) {
  const { collapsedWidth, sm, md } = props;
  const navigate = useNavigate();
  const { getUserProfile } = useProfile();
  const { getUserDashboardStats } = useDashboard();
  const { contextHolder, showMessage } = useMessageApi();

  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        getUserProfile(),
        getUserDashboardStats(),
      ]);
      setUserProfile(profileRes);
      setStats(statsRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      showMessage("error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const style = collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  const handleStatClick = (statType) => {
    switch (statType) {
      case "classrooms":
        navigate("/classrooms");
        break;
      case "courses":
        navigate("/courses");
        break;
      case "videos":
        navigate("/video-subtitles/mylibrary");
        break;
      case "contributions":
        navigate("/profile");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <MetaDecorator
        title="Dashboard - TalkMotion"
        description="Your interactive dashboard for Deaf community collaboration"
      />
      <div style={style} className="layout-bg mh-100vh" role="main" aria-label="Dashboard">
        {contextHolder}

        {/* Header Section */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Welcome{userProfile?.first ? `, ${userProfile.first}` : ""}!
              </Title>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Your community collaboration hub
              </Text>
            </div>
            <Space>
              <NotificationsPanel />
            </Space>
          </div>

          {/* Quick Stats */}
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} xs={12} sm={12} md={6}>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} md={6}>
                <DashboardStatsCard
                  title="Active Classrooms"
                  value={stats?.activeClassrooms || 0}
                  onClick={() => handleStatClick("classrooms")}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <DashboardStatsCard
                  title="My Courses"
                  value={stats?.myCourses || 0}
                  onClick={() => handleStatClick("courses")}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <DashboardStatsCard
                  title="Videos Created"
                  value={stats?.videosCreated || 0}
                  onClick={() => handleStatClick("videos")}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <DashboardStatsCard
                  title="Contributions"
                  value={stats?.communityContributions || 0}
                  onClick={() => handleStatClick("contributions")}
                />
              </Col>
            </Row>
          )}
        </div>

        {/* Main Content Grid */}
        <Row gutter={[16, 16]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              {/* Quick Actions */}
              <Col xs={24}>
                <QuickActionsPanel sm={sm} />
              </Col>

              {/* Activity Feed */}
              <Col xs={24}>
                <ActivityFeedWidget limit={10} sm={sm} />
              </Col>

              {/* Active Classrooms */}
              <Col xs={24}>
                <ActiveClassroomsWidget limit={4} sm={sm} collapsedWidth={collapsedWidth} />
              </Col>
            </Row>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <Row gutter={[16, 16]}>
              {/* Learning Progress */}
              <Col xs={24}>
                <LearningProgressWidget sm={sm} />
              </Col>

              {/* AI Learning Insights */}
              <Col xs={24}>
                <AILearningInsights 
                  unacknowledgedOnly={true} 
                  limit={3} 
                  showTitle={true}
                  style={{ marginBottom: 0 }}
                />
              </Col>

              {/* AI Recommendations */}
              <Col xs={24}>
                <AIRecommendations
                  recommendationType="video"
                  limit={5}
                  showTitle={true}
                  style={{ marginBottom: 0 }}
                />
              </Col>

              {/* Recent Videos */}
              <Col xs={24}>
                <RecentVideosWidget type="created" limit={5} sm={sm} />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Community Spotlight - Full Width */}
        <div style={{ marginTop: "24px" }}>
          <CommunitySpotlightWidget sm={sm} />
        </div>
      </div>
    </>
  );
}

export default DashboardNew;

