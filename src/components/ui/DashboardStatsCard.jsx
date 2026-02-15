import React from "react";
import { Card, Statistic, Skeleton } from "antd";
import { TeamOutlined, BookOutlined, VideoCameraOutlined, TrophyOutlined } from "@ant-design/icons";

const iconMap = {
  classrooms: <TeamOutlined style={{ fontSize: "24px", color: "#1890ff" }} />,
  courses: <BookOutlined style={{ fontSize: "24px", color: "#52c41a" }} />,
  videos: <VideoCameraOutlined style={{ fontSize: "24px", color: "#722ed1" }} />,
  contributions: <TrophyOutlined style={{ fontSize: "24px", color: "#fa8c16" }} />,
};

export const DashboardStatsCard = ({ title, value, icon, loading = false, onClick }) => {
  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <Statistic
        title={title}
        value={value || 0}
        prefix={icon || iconMap[title.toLowerCase().replace(/\s+/g, "")] || <TeamOutlined style={{ fontSize: "24px", color: "#1890ff" }} />}
        valueStyle={{ fontSize: "24px", fontWeight: 600 }}
      />
    </Card>
  );
};

export default DashboardStatsCard;

