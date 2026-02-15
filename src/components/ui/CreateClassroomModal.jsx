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
  TeamOutlined,
  InboxOutlined,
  UploadOutlined,
  EyeOutlined,
  LockOutlined,
  GlobalOutlined,
  UserOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useClassrooms from "../../hooks/useClassrooms";
import useBase64String from "../../hooks/useBase64String";

const { Text, Paragraph } = Typography;

const CreateClassroomModal = (props) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { normFile } = useClassrooms();
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { createClassroom, setLoading, onSuccess } = props;

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
      
      if (values.dragger && values.dragger.length > 0) {
        imageBase64 = await getBase64(values.dragger[0].originFileObj);
      }

      await createClassroom(
        values.name,
        values.description || "",
        imageBase64,
        values.visibility === true || values.visibility === "public"
      );

      setUploading(false);
      form.resetFields();
      setImagePreview(null);
      setOpen(false);
      showMessage("success", "Classroom created successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setUploading(false);
      showMessage("error", "Failed to create classroom. Please try again.");
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
        icon={<TeamOutlined />}
        onClick={() => setOpen(true)}
        size="large"
        style={{
          borderRadius: "var(--radius-md)",
          fontWeight: 500,
          height: "40px",
        }}
      >
        Create Classroom
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <TeamOutlined style={{ color: "var(--color-primary)" }} />
            <span>Create New Classroom</span>
          </Space>
        }
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
        aria-labelledby="new-classroom-title"
        aria-describedby="new-classroom-description"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ visibility: true }}
          requiredMark={false}
        >
          <Alert
            message="Create a classroom to organize students and share learning materials"
            type="info"
            showIcon
            style={{ marginBottom: "var(--spacing-lg)" }}
          />

          <Form.Item
            name="name"
            label={
              <Text strong>
                Classroom Name <Text type="danger">*</Text>
              </Text>
            }
            rules={[
              {
                required: true,
                message: "Please enter a classroom name",
              },
              {
                min: 3,
                message: "Classroom name must be at least 3 characters",
              },
              {
                max: 100,
                message: "Classroom name must be less than 100 characters",
              },
            ]}
          >
            <Input
              placeholder="e.g., Sign Language 101"
              size="large"
              prefix={<TeamOutlined style={{ color: "var(--color-text-secondary)" }} />}
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
              placeholder="Describe the purpose and goals of this classroom..."
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="dragger"
            label={<Text strong>Classroom Image</Text>}
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
            tooltip="Public classrooms can be discovered by others. Private classrooms are only accessible to invited members."
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
                Create Classroom
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateClassroomModal;

