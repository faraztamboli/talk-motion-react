import React, { useState, useEffect } from "react";
import { Button, List, Avatar, Space, Tag, Empty, Modal } from "antd";
import { 
  CheckOutlined, 
  CloseOutlined, 
  UserOutlined,
  LoadingOutlined 
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useClassrooms from "../../hooks/useClassrooms";
import { Link } from "react-router-dom";

const isAuthorizationError = (errorMsg) => {
  return errorMsg.includes("neither classroom teacher or creator") || 
         errorMsg.includes("not student, teacher or creator");
};

const ApproveClassroomRequest = ({ 
  classroomId, 
  role = "student",
  onApprovalChange 
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { contextHolder, showMessage } = useMessageApi();
  const { 
    getClassStudents, 
    getClassTeachers,
    approveStudentRequestToClass,
    approveTeacherRequestToClass 
  } = useClassrooms();

  useEffect(() => {
    loadRequests();
  }, [classroomId, role]);

  const loadRequests = () => {
    setLoading(true);
    const fetchFunction = role === "student" 
      ? () => getClassStudents(classroomId, false) // false = pending requests
      : () => getClassTeachers(classroomId, false); // false = pending requests

    fetchFunction()
      .then((res) => {
        // The API should return only pending requests when is_approved=false
        // But filter just in case
        const pending = (res || []).filter(item => !item.is_approved);
        setRequests(pending);
        setLoading(false);
      })
      .catch((err) => {
        const errorMsg = err?.message || err?.toString() || "";
        // Check if it's an authorization error
        if (isAuthorizationError(errorMsg)) {
          // User doesn't have permission - show user-friendly message
          showMessage("warning", `You need to be a teacher or creator of this classroom to view and approve ${role} requests.`);
          setRequests([]);
          setLoading(false);
        } else {
          console.error("Error loading requests:", err);
          showMessage("error", "Failed to load requests. Please try again.");
          setLoading(false);
        }
      });
  };

  const handleApprove = (requestId, userName) => {
    setProcessingId(requestId);
    const approveFunction = role === "student"
      ? approveStudentRequestToClass
      : approveTeacherRequestToClass;

    approveFunction(requestId)
      .then((res) => {
        console.log(res);
        showMessage("success", `${userName}'s request has been approved.`);
        setProcessingId(null);
        loadRequests();
        if (onApprovalChange) onApprovalChange();
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "Unable to approve request. Please try again.");
        setProcessingId(null);
      });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
        <LoadingOutlined style={{ fontSize: 24 }} spin />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Empty
        description={`No pending ${role} requests`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <>
      {contextHolder}
      <List
        itemLayout="horizontal"
        dataSource={requests}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined aria-hidden="true" />}
                onClick={() => handleApprove(item.request_id || item.id || item.user_id, item.fullname || item.username)}
                loading={processingId === (item.request_id || item.id || item.user_id)}
                aria-label={`Approve request from ${item.fullname || item.username}`}
              >
                Approve
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={item.sm_img}
                  icon={<UserOutlined />}
                />
              }
              title={
                <Link to={`/profile/${item.fullname || item.username}`}>
                  {item.fullname || item.username || "Unknown User"}
                </Link>
              }
              description={
                <Space>
                  <Tag color="orange">Pending Approval</Tag>
                  {item.email && <span>{item.email}</span>}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </>
  );
};

export default ApproveClassroomRequest;

