import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Upload,
  Space,
  Typography,
  Divider,
  Alert,
} from "antd";
import {
  FolderOutlined,
  InboxOutlined,
  SaveOutlined,
  EyeOutlined,
  LockOutlined,
  GlobalOutlined,
  EditOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useBase64String from "../../hooks/useBase64String";
import useFolders from "../../hooks/useFolders";

const { Text, Paragraph } = Typography;

const EditCourseModal = (props) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { updateFolder } = useFolders();
  const { course, onSuccess } = props;

  useEffect(() => {
    if (open && course) {
      // Pre-populate form with course data
      form.setFieldsValue({
        name: course.name,
        description: course.description,
        visibility: course.is_public !== undefined ? course.is_public : true,
      });
      setImagePreview(course.image || null);
    }
  }, [open, course, form]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleImageChange = (info) => {
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      // If no new image selected, keep existing image
      setImagePreview(course?.image || null);
    }
  };

  const handleSubmit = async (values) => {
    if (!course || !course.id) {
      showMessage("error", "Course information is missing");
      return;
    }

    setUploading(true);
    try {
      // Prepare update parameters - pass null for fields that haven't changed
      const name = values.name !== course.name ? values.name : null;
      const description = values.description !== course.description ? values.description : null;
      let imageBase64 = null;
      
      // Only process new image if one was uploaded
      if (values.image && values.image.length > 0) {
        imageBase64 = await getBase64(values.image[0].originFileObj);
      }
      
      const isPublic = values.visibility !== course.is_public ? (values.visibility === true || values.visibility === "public") : null;
      
      // Call updateFolder with the folder ID and only changed fields
      const result = await updateFolder(
        course.id,
        name,
        description,
        imageBase64,
        isPublic
      );
      
      // Check if update was successful
      if (result.status === "fail") {
        throw new Error(result.error || result.operation_status || "Failed to update folder");
      }

      setUploading(false);
      form.resetFields();
      setImagePreview(null);
      setOpen(false);
      showMessage("success", "Course updated successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setUploading(false);
      showMessage("error", err.message || "Failed to update course. Please try again.");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImagePreview(course?.image || null);
    setOpen(false);
  };

  if (!course) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Button
        type="default"
        icon={<EditOutlined />}
        onClick={() => setOpen(true)}
        size="small"
        style={{
          borderRadius: "var(--radius-md)",
        }}
      >
        Edit
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <EditOutlined style={{ color: "var(--color-primary)" }} />
            <span>Edit Course</span>
          </Space>
        }
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
        aria-labelledby="edit-course-title"
        aria-describedby="edit-course-description"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: course.name,
            description: course.description,
            visibility: course.is_public !== undefined ? course.is_public : true,
          }}
          requiredMark={false}
        >
          <Alert
            message="Update your course information"
            type="info"
            showIcon
            style={{ marginBottom: "var(--spacing-lg)" }}
          />

          <Form.Item
            name="name"
            label={
              <Text strong>
                Course Name <Text type="danger">*</Text>
              </Text>
            }
            rules={[
              {
                required: true,
                message: "Please enter a course name",
              },
              {
                min: 3,
                message: "Course name must be at least 3 characters",
              },
              {
                max: 100,
                message: "Course name must be less than 100 characters",
              },
            ]}
          >
            <Input
              placeholder="e.g., Introduction to Sign Language"
              size="large"
              prefix={<FolderOutlined style={{ color: "var(--color-text-secondary)" }} />}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<Text strong>Description</Text>}
            rules={[
              {
                max: 500,
                message: "Description must be less than 500 characters",
              },
            ]}
          >
            <Input.TextArea
              placeholder="Describe what this course covers..."
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="image"
            label={<Text strong>Course Image</Text>}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload.Dragger
              name="image"
              accept="image/*"
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleImageChange}
              style={{
                background: imagePreview
                  ? `url(${imagePreview}) center/cover`
                  : "var(--color-neutral-50)",
              }}
            >
              {!imagePreview && (
                <>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: "var(--color-primary)" }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
                    Click or drag image to upload
                  </p>
                  <p className="ant-upload-hint" style={{ color: "var(--color-text-secondary)" }}>
                    Leave empty to keep current image
                  </p>
                </>
              )}
            </Upload.Dragger>
            {imagePreview && (
              <div style={{ marginTop: "var(--spacing-sm)", textAlign: "center" }}>
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => window.open(imagePreview, "_blank")}
                    size="small"
                  >
                    Preview Image
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setImagePreview(course.image || null);
                      form.setFieldValue("image", []);
                    }}
                  >
                    Reset to Original
                  </Button>
                </Space>
              </div>
            )}
          </Form.Item>

          <Divider />

          <Form.Item
            name="visibility"
            label={<Text strong>Visibility</Text>}
            tooltip="Public courses can be seen by everyone. Private courses are only visible to you."
          >
            <Radio.Group size="large" style={{ width: "100%" }}>
              <Radio.Button
                value={true}
                style={{
                  flex: 1,
                  textAlign: "center",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Space>
                  <GlobalOutlined />
                  Public
                </Space>
              </Radio.Button>
              <Radio.Button
                value={false}
                style={{
                  flex: 1,
                  textAlign: "center",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Space>
                  <LockOutlined />
                  Private
                </Space>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "var(--spacing-lg)" }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={uploading}
                icon={<SaveOutlined />}
                style={{
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  minWidth: 120,
                }}
              >
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EditCourseModal;

