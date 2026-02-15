import React, { useState, useEffect } from "react";
import { Card, Tabs, Row, Col, Empty, Skeleton, Tag, Space } from "antd";
import {
  TeamOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import useDashboard from "../../hooks/useDashboard";
import useMessageApi from "../../hooks/useMessageApi";
import { ClassroomCard } from "./ClassroomCard";

export const CommunitySpotlightWidget = ({ sm }) => {
  const [featuredClassrooms, setFeaturedClassrooms] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getFeaturedClassrooms, getPopularVideos } = useDashboard();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadSpotlightData();
  }, []);

  const loadSpotlightData = async () => {
    setLoading(true);
    try {
      const [classroomsRes, videosRes] = await Promise.all([
        getFeaturedClassrooms(5),
        getPopularVideos("week", 5),
      ]);
      setFeaturedClassrooms(classroomsRes.classrooms || []);
      setPopularVideos(videosRes.videos || []);
    } catch (err) {
      console.error("Error loading spotlight data:", err);
      showMessage("error", "Failed to load community spotlight");
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: "featured-classrooms",
      label: (
        <Space>
          <TeamOutlined />
          Featured Classrooms
        </Space>
      ),
      children: (
        <div>
          {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : featuredClassrooms.length === 0 ? (
            <Empty description="No featured classrooms" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[12, 12]}>
              {featuredClassrooms.map((classroom) => (
                <Col key={classroom.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{ height: "100%" }}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <Link to={`/classroom/${classroom.id}`} style={{ fontSize: "14px", fontWeight: 500 }}>
                        {classroom.name}
                      </Link>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "8px" }}>
                      {classroom.description?.substring(0, 50)}
                      {classroom.description?.length > 50 && "..."}
                    </div>
                    <Space>
                      <Tag icon={<TeamOutlined />} color="blue">
                        {classroom.memberCount || 0} members
                      </Tag>
                      {classroom.recentActivityCount > 0 && (
                        <Tag color="green">
                          <FireOutlined /> {classroom.recentActivityCount} new
                        </Tag>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: "popular-videos",
      label: (
        <Space>
          <VideoCameraOutlined />
          Popular Videos
        </Space>
      ),
      children: (
        <div>
          {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : popularVideos.length === 0 ? (
            <Empty description="No popular videos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[12, 12]}>
              {popularVideos.map((video) => (
                <Col key={video.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{ height: "100%" }}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <Link
                        to={`/video-subtitles/library/${video.id}`}
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      >
                        {video.title}
                      </Link>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "8px" }}>
                      {video.creator?.name}
                    </div>
                    <Tag icon={<TrophyOutlined />} color="gold">
                      {video.viewCount || 0} views
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card title="Community Spotlight" style={{ height: "100%" }}>
        <Tabs items={tabItems} size="small" />
      </Card>
    </>
  );
};

export default CommunitySpotlightWidget;

