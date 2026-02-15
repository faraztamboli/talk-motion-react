import React, { useState, useEffect } from "react";
import { Card, Statistic, Button, Space, Badge, Empty } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useClassrooms from "../../hooks/useClassrooms";
import useMessageApi from "../../hooks/useMessageApi";

const isAuthorizationError = (errorMsg) => {
  return errorMsg.includes("neither classroom teacher or creator") || 
         errorMsg.includes("not student, teacher or creator");
};

const PendingRequestsCard = ({ classroomId, onViewDetails }) => {
  const [stats, setStats] = useState({
    studentRequests: 0,
    teacherRequests: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const { getClassStudents, getClassTeachers } = useClassrooms();
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (classroomId) {
      loadRequestStats();
    }
  }, [classroomId]);

  const loadRequestStats = async () => {
    setLoading(true);
    try {
      let students = [];
      let teachers = [];
      let hasPermissionError = false;

      try {
        students = await getClassStudents(classroomId, false); // false = pending
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          hasPermissionError = true;
        } else {
          console.error("Error loading pending students:", err);
        }
      }

      try {
        teachers = await getClassTeachers(classroomId, false); // false = pending
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          hasPermissionError = true;
        } else {
          console.error("Error loading pending teachers:", err);
        }
      }

      // Show user-friendly message if permission error occurred
      if (hasPermissionError && classroomId) {
        // Only show message if we're loading for a specific classroom
        // (not for the aggregate card)
        showMessage("info", "You need to be a teacher or creator to view pending requests.");
      }

      // Filter pending requests (API should return only pending when is_approved=false, but filter just in case)
      const pendingStudents = students?.filter((s) => !s.is_approved) || [];
      const pendingTeachers = teachers?.filter((t) => !t.is_approved) || [];

      setStats({
        studentRequests: pendingStudents.length,
        teacherRequests: pendingTeachers.length,
        total: pendingStudents.length + pendingTeachers.length,
      });
    } catch (err) {
      console.error("Error loading request stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Statistic
          title="Pending Requests"
          value={0}
          prefix={<ClockCircleOutlined />}
          loading
        />
      </Card>
    );
  }

  if (stats.total === 0) {
    return (
      <Card>
        <Statistic
          title="Pending Requests"
          value={0}
          prefix={<ClockCircleOutlined />}
          valueStyle={{ color: "var(--color-text-secondary)" }}
        />
        <p style={{ marginTop: "var(--spacing-sm)", fontSize: "12px", color: "var(--color-text-secondary)" }}>
          No pending requests
        </p>
      </Card>
    );
  }

  return (
    <>
      {contextHolder}
      <Card
        hoverable
        style={{
          cursor: onViewDetails ? "pointer" : "default",
        }}
        onClick={onViewDetails}
        actions={[
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (onViewDetails) onViewDetails();
              else if (classroomId) navigate(`/classroom/${classroomId}?tab=requests`);
            }}
          >
            View Requests
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Statistic
            title={
              <Space>
                <ClockCircleOutlined />
                Pending Requests
              </Space>
            }
            value={stats.total}
            valueStyle={{ color: "var(--color-warning)" }}
            suffix={
              <Badge
                count={stats.total}
                style={{ backgroundColor: "var(--color-warning)" }}
              />
            }
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--spacing-sm)",
              paddingTop: "var(--spacing-sm)",
              borderTop: "1px solid var(--color-neutral-200)",
            }}
          >
            <Space>
              <UserOutlined style={{ color: "var(--color-info)" }} />
              <span style={{ fontSize: "14px" }}>{stats.studentRequests} Students</span>
            </Space>
            <Space>
              <TeamOutlined style={{ color: "var(--color-warning)" }} />
              <span style={{ fontSize: "14px" }}>{stats.teacherRequests} Teachers</span>
            </Space>
          </div>
        </Space>
      </Card>
    </>
  );
};

export default PendingRequestsCard;

