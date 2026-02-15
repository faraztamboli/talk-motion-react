import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Tabs,
  Card,
  Empty,
  Space,
  Typography,
  Tag,
  Avatar,
  Spin,
  Alert,
} from "antd";
import {
  PlayCircleOutlined,
  RobotOutlined,
  SearchOutlined,
  CheckOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useSubtitleVideos from "../../hooks/useSubtitleVideos";
import useModels from "../../hooks/useModels";
import useFolders from "../../hooks/useFolders";

const { Text, Title } = Typography;
const { Search } = Input;

const AddContentModal = (props) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [videoRecordings, setVideoRecordings] = useState([]);
  const [models, setModels] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customName, setCustomName] = useState("");
  const { getMyVideoRecordings } = useSubtitleVideos();
  const { getUserModels } = useModels();
  const { saveFolderContent } = useFolders();
  const { contextHolder, showMessage } = useMessageApi();
  const { folderId, onSuccess } = props;

  useEffect(() => {
    if (open) {
      // Load initial data
      loadVideos("");
      loadModels("");
    }
  }, [open]);

  const loadVideos = async (search = "") => {
    setLoading(true);
    try {
      const res = await getMyVideoRecordings(search, 0, 99999);
      setVideoRecordings(res[0] || []);
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (search = "") => {
    setLoading(true);
    try {
      const res = await getUserModels(search, 0, 9999);
      setModels(res[0] || []);
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (activeTab === "videos") {
      loadVideos(value);
    } else {
      loadModels(value);
    }
  };

  const handleSelect = (item, type) => {
    setSelectedItem({ ...item, type });
    setCustomName(item.title || item.original_video_title || "");
  };

  const handleSubmit = async () => {
    if (!selectedItem) {
      showMessage("warning", "Please select a video or model");
      return;
    }

    if (!customName.trim()) {
      showMessage("warning", "Please enter a name for this content");
      return;
    }

    setLoading(true);
    try {
      await saveFolderContent(
        folderId,
        selectedItem.id,
        selectedItem.type === "video" ? "recording" : "model",
        customName.trim()
      );
      setLoading(false);
      showMessage("success", "Content added successfully!");
      handleCancel();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setLoading(false);
      showMessage("error", "Failed to add content. Please try again.");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedItem(null);
    setCustomName("");
    setSearchText("");
    setActiveTab("videos");
  };

  const tabItems = [
    {
      key: "videos",
      label: (
        <Space>
          <PlayCircleOutlined />
          Videos
        </Space>
      ),
      children: (
        <div>
          <Search
            placeholder="Search your videos..."
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
            style={{ marginBottom: "var(--spacing-md)" }}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
              <Spin size="large" />
            </div>
          ) : videoRecordings.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--spacing-md)",
                maxHeight: "400px",
                overflowY: "auto",
                padding: "var(--spacing-xs)",
              }}
            >
              {videoRecordings.map((video) => (
                <Card
                  key={video.id}
                  hoverable
                  onClick={() => handleSelect(video, "video")}
                  style={{
                    cursor: "pointer",
                    border:
                      selectedItem?.id === video.id && selectedItem?.type === "video"
                        ? "2px solid var(--color-primary)"
                        : "1px solid var(--color-neutral-300)",
                    backgroundColor:
                      selectedItem?.id === video.id && selectedItem?.type === "video"
                        ? "var(--color-primary-light)"
                        : "white",
                  }}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        icon={<PlayCircleOutlined />}
                        size={48}
                        style={{
                          backgroundColor: "var(--color-success-light)",
                          color: "var(--color-success)",
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong ellipsis style={{ maxWidth: 150 }}>
                          {video.original_video_title || "Untitled Video"}
                        </Text>
                        {selectedItem?.id === video.id && selectedItem?.type === "video" && (
                          <Tag icon={<CheckOutlined />} color="success">
                            Selected
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" ellipsis>
                        Video Recording
                      </Text>
                    }
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description={
                searchText
                  ? "No videos found matching your search"
                  : "You don't have any videos yet"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
    {
      key: "models",
      label: (
        <Space>
          <RobotOutlined />
          Models
        </Space>
      ),
      children: (
        <div>
          <Search
            placeholder="Search your models..."
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
            style={{ marginBottom: "var(--spacing-md)" }}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
              <Spin size="large" />
            </div>
          ) : models.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--spacing-md)",
                maxHeight: "400px",
                overflowY: "auto",
                padding: "var(--spacing-xs)",
              }}
            >
              {models.map((model) => (
                <Card
                  key={model.id}
                  hoverable
                  onClick={() => handleSelect(model, "model")}
                  style={{
                    cursor: "pointer",
                    border:
                      selectedItem?.id === model.id && selectedItem?.type === "model"
                        ? "2px solid var(--color-primary)"
                        : "1px solid var(--color-neutral-300)",
                    backgroundColor:
                      selectedItem?.id === model.id && selectedItem?.type === "model"
                        ? "var(--color-primary-light)"
                        : "white",
                  }}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        icon={<RobotOutlined />}
                        size={48}
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong ellipsis style={{ maxWidth: 150 }}>
                          {model.title || "Untitled Model"}
                        </Text>
                        {selectedItem?.id === model.id && selectedItem?.type === "model" && (
                          <Tag icon={<CheckOutlined />} color="success">
                            Selected
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" ellipsis>
                        {model.description || "Gesture Recognition Model"}
                      </Text>
                    }
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description={
                searchText
                  ? "No models found matching your search"
                  : "You don't have any models yet"
              }
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
        type="primary"
        icon={<FileTextOutlined />}
        onClick={() => setOpen(true)}
        size="large"
        style={{
          borderRadius: "var(--radius-md)",
          fontWeight: 500,
          height: "40px",
        }}
      >
        Add Content
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            <FileTextOutlined style={{ color: "var(--color-primary)" }} />
            <span>Add Content to Course</span>
          </Space>
        }
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
        aria-labelledby="add-content-title"
      >
        <Alert
          message="Select a video or model to add to this course"
          type="info"
          showIcon
          style={{ marginBottom: "var(--spacing-lg)" }}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ minHeight: 400 }}
        />

        {selectedItem && (
          <div
            style={{
              marginTop: "var(--spacing-lg)",
              padding: "var(--spacing-md)",
              backgroundColor: "var(--color-neutral-50)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-primary-light)",
            }}
          >
            <Title level={5} style={{ marginBottom: "var(--spacing-sm)" }}>
              Selected Item
            </Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>
                {selectedItem.title ||
                  selectedItem.original_video_title ||
                  "Untitled"}
              </Text>
              <Input
                placeholder="Enter a custom name for this content (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                size="large"
                maxLength={100}
                showCount
              />
            </Space>
          </div>
        )}

        <div
          style={{
            marginTop: "var(--spacing-lg)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--spacing-sm)",
          }}
        >
          <Button onClick={handleCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            size="large"
            loading={loading}
            disabled={!selectedItem || !customName.trim()}
            style={{
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              minWidth: 120,
            }}
          >
            Add to Course
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default AddContentModal;

