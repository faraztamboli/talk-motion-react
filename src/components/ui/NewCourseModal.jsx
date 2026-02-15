import React, { useState } from "react";
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
  UploadOutlined,
  EyeOutlined,
  LockOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useBase64String from "../../hooks/useBase64String";

const { Text, Paragraph } = Typography;

const NewCourseModal = (props) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { saveFolder, setLoading, folderId, onSuccess } = props;

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
      setImagePreview(null);
    }
  };

  const handleSubmit = async (values) => {
    setUploading(true);
    try {
      let imageBase64 = null;
      
      if (values.image && values.image.length > 0) {
        imageBase64 = await getBase64(values.image[0].originFileObj);
      }

      await saveFolder(
        values.name,
        values.description || "",
        folderId || null,
        imageBase64,
        values.visibility === true || values.visibility === "public"
      );

      setUploading(false);
      form.resetFields();
      setImagePreview(null);
      setOpen(false);
      showMessage("success", "Course created successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setUploading(false);
      showMessage("error", "Failed to create course. Please try again.");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImagePreview(null);
    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<FolderOutlined />}
        onClick={() => setOpen(true)}
        size="large"
        style={{
          borderRadius: "var(--radius-md)",
          fontWeight: 500,
          height: "40px",
        }}
      >
        New Course
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <FolderOutlined style={{ color: "var(--color-primary)" }} />
            <span>Create New Course</span>
          </Space>
        }
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
        aria-labelledby="new-course-title"
        aria-describedby="new-course-description"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ visibility: true }}
          requiredMark={false}
        >
          <Alert
            message="Create a new course to organize your learning content"
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
              autoFocus
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
                    Recommended: 400x400px, JPG or PNG
                  </p>
                </>
              )}
            </Upload.Dragger>
            {imagePreview && (
              <div style={{ marginTop: "var(--spacing-sm)", textAlign: "center" }}>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => window.open(imagePreview, "_blank")}
                  size="small"
                >
                  Preview Image
                </Button>
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
                icon={<UploadOutlined />}
                style={{
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  minWidth: 120,
                }}
              >
                Create Course
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewCourseModal;

