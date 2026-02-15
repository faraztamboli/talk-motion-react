import React, { useState, useEffect } from "react";
import { Card, Row, Col, Empty, Skeleton, Space, Tag } from "antd";
import { TeamOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { ClassroomCard } from "./ClassroomCard";
import useDashboard from "../../hooks/useDashboard";
import useMessageApi from "../../hooks/useMessageApi";
import { formatDistanceToNow } from "../../utils/dateUtils";

export const ActiveClassroomsWidget = ({ limit = 4, sm, collapsedWidth }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserActiveClassrooms } = useDashboard();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const res = await getUserActiveClassrooms(limit);
      setClassrooms(res.classrooms || []);
    } catch (err) {
      console.error("Error loading active classrooms:", err);
      showMessage("error", "Failed to load active classrooms");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Never";
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
            <TeamOutlined />
            My Active Classrooms
          </Space>
        }
        style={{ height: "100%" }}
        bodyStyle={{ padding: sm ? "12px" : "16px" }}
        extra={
          classrooms.length > 0 && (
            <a href="/classrooms" style={{ fontSize: "12px" }}>
              View all
            </a>
          )
        }
      >
        {loading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={24} sm={12} md={12} lg={12}>
                <Skeleton active style={{ height: 200 }} />
              </Col>
            ))}
          </Row>
        ) : classrooms.length === 0 ? (
          <Empty
            description="No active classrooms"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <a href="/classrooms">Browse classrooms</a>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {classrooms.map((classroom) => (
              <Col key={classroom.id} xs={24} sm={12} md={12} lg={12}>
                <Card
                  hoverable
                  style={{ height: "100%" }}
                  bodyStyle={{ padding: "16px" }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, marginBottom: "4px", fontSize: "16px" }}>
                      {classroom.name}
                    </h3>
                    <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "8px" }}>
                      {classroom.description?.substring(0, 60)}
                      {classroom.description?.length > 60 && "..."}
                    </div>
                  </div>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>
                        <TeamOutlined /> {classroom.memberCount || 0} members
                      </span>
                      {classroom.recentActivityCount > 0 && (
                        <Tag color="green">{classroom.recentActivityCount} new</Tag>
                      )}
                    </div>
                    {classroom.lastAccessed && (
                      <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                        <ClockCircleOutlined /> Last accessed {formatTime(classroom.lastAccessed)}
                      </div>
                    )}
                    <a href={`/classroom/${classroom.id}`} style={{ fontSize: "12px" }}>
                      Open classroom →
                    </a>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </>
  );
};

export default ActiveClassroomsWidget;

