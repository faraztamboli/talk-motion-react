import React, { useState } from "react";
import { Modal, Button, Space, Typography, Alert } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useFolders from "../../hooks/useFolders";

const { Text } = Typography;

const DeleteCourseModal = ({ course, onSuccess, onCancel: externalOnCancel }) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const { deleteFolder } = useFolders();

  const handleDelete = async () => {
    if (!course || !course.id) {
      showMessage("error", "Course information is missing");
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteFolder(course.id);
      
      // Check if deletion was successful
      if (result.status === "fail") {
        throw new Error(result.error || result.operation_status || "Failed to delete folder");
      }

      setDeleting(false);
      setOpen(false);
      showMessage("success", "Course and all its contents deleted successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setDeleting(false);
      showMessage("error", err.message || "Failed to delete course. Please try again.");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    if (externalOnCancel) externalOnCancel();
  };

  if (!course) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Button
        type="default"
        danger
        icon={<DeleteOutlined />}
        onClick={() => setOpen(true)}
        size="small"
        style={{
          borderRadius: "var(--radius-md)",
        }}
      >
        Delete
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "var(--color-error)" }} />
            <span>Delete Course</span>
          </Space>
        }
        onCancel={handleCancel}
        footer={
          <Space>
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleDelete}
              size="large"
              loading={deleting}
              icon={<DeleteOutlined />}
              style={{
                borderRadius: "var(--radius-md)",
                fontWeight: 500,
                minWidth: 120,
              }}
            >
              Delete Course
            </Button>
          </Space>
        }
        width={500}
        destroyOnClose
      >
        <Alert
          message="Warning: This action cannot be undone"
          description={
            <div>
              <Text>
                Are you sure you want to delete <strong>{course.name}</strong>?
              </Text>
              <br />
              <br />
              <Text type="secondary">
                This will permanently delete the course and all its contents including:
              </Text>
              <ul style={{ marginTop: "var(--spacing-xs)", paddingLeft: "var(--spacing-lg)" }}>
                {course.children && course.children.length > 0 && (
                  <li>
                    <Text type="secondary">
                      {course.children.length} topic(s)
                    </Text>
                  </li>
                )}
                {course.contents && course.contents.length > 0 && (
                  <li>
                    <Text type="secondary">
                      {course.contents.length} content item(s)
                    </Text>
                  </li>
                )}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: "var(--spacing-md)" }}
        />
      </Modal>
    </>
  );
};

export default DeleteCourseModal;

