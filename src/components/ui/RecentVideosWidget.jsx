import React, { useState, useEffect } from "react";
import { Card, List, Avatar, Empty, Skeleton, Space, Typography } from "antd";
import { VideoCameraOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useDashboard from "../../hooks/useDashboard";
import useMessageApi from "../../hooks/useMessageApi";
import { formatDistanceToNow } from "../../utils/dateUtils";

const { Text } = Typography;

export const RecentVideosWidget = ({ type = "created", limit = 5, sm }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserRecentVideos } = useDashboard();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadVideos();
  }, [type]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await getUserRecentVideos(type, limit);
      setVideos(res.videos || []);
    } catch (err) {
      console.error("Error loading recent videos:", err);
      showMessage("error", "Failed to load recent videos");
    } finally {
      setLoading(false);
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
            <VideoCameraOutlined />
            {type === "created" ? "My Recent Videos" : "Recently Viewed"}
          </Space>
        }
        style={{ height: "100%" }}
        bodyStyle={{ padding: sm ? "12px" : "16px", maxHeight: "400px", overflowY: "auto" }}
        extra={
          videos.length > 0 && (
            <Link to={type === "created" ? "/video-subtitles/mylibrary" : "/video-subtitles/library"}>
              View all
            </Link>
          )
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : videos.length === 0 ? (
          <Empty
            description={`No ${type === "created" ? "videos created" : "videos viewed"} yet`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={videos}
            renderItem={(video) => (
              <List.Item
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<VideoCameraOutlined />}
                      style={{ backgroundColor: "#722ed1" }}
                    />
                  }
                  title={
                    <Link
                      to={`/video-subtitles/library/${video.id}`}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    >
                      {video.title}
                    </Link>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      {video.creator && (
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                          <UserOutlined /> {video.creator.name}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#8c8c8c" }}>
                        {video.viewCount !== undefined && (
                          <span>
                            <EyeOutlined /> {video.viewCount} views
                          </span>
                        )}
                        {video.createdAt && <span>{formatTime(video.createdAt)}</span>}
                      </div>
                    </Space>
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

export default RecentVideosWidget;

