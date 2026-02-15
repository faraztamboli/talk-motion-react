import React, { useState, useEffect } from "react";
import { Card, Progress, List, Empty, Skeleton, Tag, Space, Row, Col, Statistic, Typography } from "antd";
import { Link } from "react-router-dom";

const { Text } = Typography;
import {
  BookOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import useDashboard from "../../hooks/useDashboard";
import useMessageApi from "../../hooks/useMessageApi";

export const LearningProgressWidget = ({ sm }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getUserLearningProgress } = useDashboard();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await getUserLearningProgress();
      setProgress(res);
    } catch (err) {
      console.error("Error loading learning progress:", err);
      showMessage("error", "Failed to load learning progress");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return <RiseOutlined style={{ color: "#52c41a" }} />;
    if (trend === "down") return <FallOutlined style={{ color: "#ff4d4f" }} />;
    return null;
  };

  if (loading) {
    return (
      <Card title="Learning Progress" style={{ height: "100%" }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card title="Learning Progress" style={{ height: "100%" }}>
        <Empty description="No progress data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <>
      {contextHolder}
      <Card
        title="Learning Progress"
        style={{ height: "100%" }}
        bodyStyle={{ padding: sm ? "12px" : "16px" }}
      >
        {/* Learning Streak */}
        {progress.learningStreak && (
          <div style={{ marginBottom: "20px" }}>
            <Space>
              <FireOutlined style={{ color: "#fa8c16", fontSize: "20px" }} />
              <Statistic
                title="Learning Streak"
                value={progress.learningStreak.current || 0}
                suffix={`days (Longest: ${progress.learningStreak.longest || 0})`}
                valueStyle={{ fontSize: "18px" }}
              />
            </Space>
          </div>
        )}

        {/* Courses in Progress */}
        {progress.coursesInProgress && progress.coursesInProgress.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>
              Courses in Progress
            </h4>
            <List
              size="small"
              dataSource={progress.coursesInProgress}
              renderItem={(course) => (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Link to={`/courses/${course.courseId}`} style={{ fontSize: "13px" }}>
                        {course.courseName}
                      </Link>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {course.progress}%
                      </Text>
                    </div>
                    <Progress
                      percent={course.progress}
                      size="small"
                      strokeColor={{
                        "0%": "#108ee9",
                        "100%": "#87d068",
                      }}
                    />
                    <div style={{ fontSize: "11px", color: "#8c8c8c", marginTop: "4px" }}>
                      {course.lessonsCompleted} of {course.totalLessons} lessons completed
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="Videos Created"
              value={progress.videosCreated?.total || 0}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ fontSize: "20px" }}
            />
            {progress.videosCreated && (
              <div style={{ marginTop: "4px" }}>
                <Space size="small">
                  {getTrendIcon(progress.videosCreated.trend)}
                  <Text type="secondary" style={{ fontSize: "11px" }}>
                    {progress.videosCreated.thisWeek || 0} this week
                  </Text>
                </Space>
              </div>
            )}
          </Col>
          <Col span={12}>
            <Statistic
              title="Models Trained"
              value={progress.modelsTrained || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: "20px" }}
            />
          </Col>
        </Row>

        {/* Badges */}
        {progress.badges && progress.badges.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>
              Recent Badges
            </h4>
            <Space wrap>
              {progress.badges.slice(0, 5).map((badge) => (
                <Tag
                  key={badge.id}
                  icon={<TrophyOutlined />}
                  color="gold"
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                >
                  {badge.badgeName}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    </>
  );
};

export default LearningProgressWidget;

