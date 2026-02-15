import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  List,
  Tag,
  Empty,
  Select,
  Input,
  Form,
  Alert,
  Tabs,
  Avatar,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useFolders from "../../hooks/useFolders";

const { Text, Title } = Typography;
const { Option } = Select;

const FolderPermissionsModal = ({ folderId, course, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [form] = Form.useForm();
  const { contextHolder, showMessage } = useMessageApi();
  const {
    getFolderPermissions,
    createFolderPermission,
    deleteFolderPermission,
  } = useFolders();

  useEffect(() => {
    if (open && folderId) {
      loadPermissions();
    }
  }, [open, folderId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await getFolderPermissions(folderId);
      setPermissions(res || []);
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (values) => {
    setLoading(true);
    try {
      await createFolderPermission(
        folderId,
        values.entity_id,
        values.entity_type,
        values.permission
      );
      showMessage("success", "Permission added successfully!");
      form.resetFields();
      loadPermissions();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to add permission");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId) => {
    setLoading(true);
    try {
      await deleteFolderPermission(permissionId);
      showMessage("success", "Permission removed successfully!");
      loadPermissions();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to remove permission");
    } finally {
      setLoading(false);
    }
  };

  const userPermissions = permissions.filter((p) => p.entity_type === "user");
  const classroomPermissions = permissions.filter(
    (p) => p.entity_type === "classroom"
  );

  const getPermissionColor = (permission) => {
    if (permission.includes("delete")) return "red";
    if (permission.includes("write")) return "orange";
    return "blue";
  };

  const tabItems = [
    {
      key: "users",
      label: (
        <Space>
          <UserOutlined />
          Users ({userPermissions.length})
        </Space>
      ),
      children: (
        <div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddPermission}
            initialValues={{ entity_type: "user", permission: "read" }}
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <Form.Item name="entity_type" hidden>
              <Input />
            </Form.Item>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="entity_id"
                rules={[
                  { required: true, message: "Please select or enter user ID" },
                ]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder="Enter user ID or username"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="permission"
                rules={[{ required: true }]}
                style={{ width: 150, marginBottom: 0 }}
              >
                <Select>
                  <Option value="read">Read</Option>
                  <Option value="write">Write</Option>
                  <Option value="delete">Delete</Option>
                  <Option value="read,write">Read + Write</Option>
                  <Option value="read,write,delete">Full Access</Option>
                </Select>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  Add
                </Button>
              </Form.Item>
            </Space.Compact>
          </Form>

          {userPermissions.length > 0 ? (
            <List
              dataSource={userPermissions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Remove this permission?"
                      onConfirm={() => handleRemovePermission(item.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        Remove
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={`User ID: ${item.entity_id}`}
                    description={
                      <Space>
                        <Tag color={getPermissionColor(item.permission)}>
                          {item.permission}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description="No user permissions set"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
    {
      key: "classrooms",
      label: (
        <Space>
          <TeamOutlined />
          Classrooms ({classroomPermissions.length})
        </Space>
      ),
      children: (
        <div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddPermission}
            initialValues={{ entity_type: "classroom", permission: "read" }}
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <Form.Item name="entity_type" hidden>
              <Input />
            </Form.Item>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="entity_id"
                rules={[
                  {
                    required: true,
                    message: "Please select or enter classroom ID",
                  },
                ]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder="Enter classroom ID"
                  prefix={<TeamOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="permission"
                rules={[{ required: true }]}
                style={{ width: 150, marginBottom: 0 }}
              >
                <Select>
                  <Option value="read">Read</Option>
                  <Option value="write">Write</Option>
                  <Option value="delete">Delete</Option>
                  <Option value="read,write">Read + Write</Option>
                  <Option value="read,write,delete">Full Access</Option>
                </Select>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  Add
                </Button>
              </Form.Item>
            </Space.Compact>
          </Form>

          {classroomPermissions.length > 0 ? (
            <List
              dataSource={classroomPermissions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Remove this permission?"
                      onConfirm={() => handleRemovePermission(item.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        Remove
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<TeamOutlined />} />}
                    title={`Classroom ID: ${item.entity_id}`}
                    description={
                      <Space>
                        <Tag color={getPermissionColor(item.permission)}>
                          {item.permission}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description="No classroom permissions set"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Button
        type="default"
        icon={<LockOutlined />}
        onClick={() => setOpen(true)}
        size="small"
        style={{
          borderRadius: "var(--radius-md)",
        }}
      >
        Permissions
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <LockOutlined style={{ color: "var(--color-primary)" }} />
            <span>Manage Permissions</span>
            {course && (
              <Text type="secondary" style={{ fontSize: 14 }}>
                - {course.name}
              </Text>
            )}
          </Space>
        }
        onCancel={() => setOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Alert
          message="Share this course with users or classrooms"
          description="Grant read, write, or delete permissions to control access to this course and its contents."
          type="info"
          showIcon
          style={{ marginBottom: "var(--spacing-lg)" }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Modal>
    </>
  );
};

export default FolderPermissionsModal;

