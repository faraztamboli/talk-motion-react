import React, { useState, useEffect } from "react";
import { Card, List, Avatar, Button, Empty, Skeleton, Tag, Space } from "antd";
import { Link } from "react-router-dom";
import {
  TeamOutlined,
  BookOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import useActivityFeed from "../../hooks/useActivityFeed";
import useMessageApi from "../../hooks/useMessageApi";
import { formatDistanceToNow } from "../../utils/dateUtils";

const activityIcons = {
  classroom_update: <TeamOutlined style={{ color: "#1890ff" }} />,
  course_progress: <BookOutlined style={{ color: "#52c41a" }} />,
  video_created: <VideoCameraOutlined style={{ color: "#722ed1" }} />,
  model_trained: <TrophyOutlined style={{ color: "#fa8c16" }} />,
  classroom_joined: <TeamOutlined style={{ color: "#13c2c2" }} />,
  course_completed: <BookOutlined style={{ color: "#52c41a" }} />,
  collaboration_request: <TeamOutlined style={{ color: "#eb2f96" }} />,
};

export const ActivityFeedWidget = ({ limit = 10, sm }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserActivityFeed, markActivityAsRead } = useActivityFeed();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await getUserActivityFeed(limit, 0);
      setActivities(res.activities || []);
    } catch (err) {
      console.error("Error loading activities:", err);
      showMessage("error", "Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = async (activity) => {
    if (!activity.read && activity.id) {
      try {
        await markActivityAsRead(activity.id);
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, read: true } : a))
        );
      } catch (err) {
        console.error("Error marking activity as read:", err);
      }
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            Recent Activity
          </Space>
        }
        style={{ height: "100%" }}
        bodyStyle={{ padding: sm ? "12px" : "16px", maxHeight: "600px", overflowY: "auto" }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : activities.length === 0 ? (
          <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={activities}
            renderItem={(activity) => (
              <List.Item
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: activity.actionUrl ? "pointer" : "default",
                  backgroundColor: activity.read ? "transparent" : "#f6ffed",
                  borderRadius: "4px",
                  marginBottom: "4px",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                }}
                onClick={() => {
                  if (activity.actionUrl) {
                    handleActivityClick(activity);
                  }
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={activityIcons[activity.type] || <ClockCircleOutlined />}
                      style={{ backgroundColor: "#f0f0f0" }}
                    />
                  }
                  title={
                    <Space>
                      <span style={{ fontWeight: activity.read ? 400 : 600 }}>
                        {activity.title}
                      </span>
                      {!activity.read && <Tag color="green">New</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: "4px" }}>{activity.description}</div>
                      <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
};

export default ActivityFeedWidget;

