import React from "react";
import { Badge, Tag, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const RequestStatusBadge = ({ status, showText = true }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          color: "orange",
          icon: <ClockCircleOutlined />,
          text: "Request Pending",
          tooltip: "Your request is awaiting approval",
        };
      case "approved":
        return {
          color: "success",
          icon: <CheckCircleOutlined />,
          text: "Approved",
          tooltip: "Your request has been approved",
        };
      case "rejected":
      case "denied":
        return {
          color: "error",
          icon: <CloseCircleOutlined />,
          text: "Rejected",
          tooltip: "Your request was rejected",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <Tooltip title={config.tooltip}>
      <Tag
        icon={config.icon}
        color={config.color}
        style={{
          margin: 0,
          cursor: "help",
        }}
      >
        {showText && config.text}
      </Tag>
    </Tooltip>
  );
};

export default RequestStatusBadge;

