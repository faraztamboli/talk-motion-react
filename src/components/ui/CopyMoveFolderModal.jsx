import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  TreeSelect,
  Empty,
  Alert,
  Radio,
} from "antd";
import {
  CopyOutlined,
  FolderOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useFolders from "../../hooks/useFolders";

const { Text } = Typography;

const CopyMoveFolderModal = ({ folderId, course, operation = "copy", onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const { contextHolder, showMessage } = useMessageApi();
  const { getChildFolders, copyFolder, moveFolder } = useFolders();

  useEffect(() => {
    if (open) {
      loadFolderTree();
    }
  }, [open]);

  const loadFolderTree = async () => {
    try {
      // Load root folders (parent_id = null)
      const rootFolders = await getChildFolders(null);
      // Build tree structure
      const buildTree = (folders) => {
        return folders.map((folder) => ({
          title: folder.name,
          value: folder.id,
          key: folder.id,
          children: folder.children ? buildTree(folder.children) : [],
        }));
      };
      setFolderTree(buildTree(rootFolders));
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to load folders");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFolder) {
      showMessage("warning", "Please select a destination folder");
      return;
    }

    if (selectedFolder === folderId) {
      showMessage("warning", "Cannot move/copy folder to itself");
      return;
    }

    setLoading(true);
    try {
      if (operation === "copy") {
        await copyFolder(folderId, selectedFolder);
        showMessage("success", "Folder copied successfully!");
      } else {
        await moveFolder(folderId, selectedFolder);
        showMessage("success", "Folder moved successfully!");
      }
      setLoading(false);
      setOpen(false);
      setSelectedFolder(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setLoading(false);
      showMessage("error", `Failed to ${operation} folder. Please try again.`);
    }
  };

  return (
    <>
      {contextHolder}
      <Button
        type="default"
        icon={operation === "copy" ? <CopyOutlined /> : <ArrowRightOutlined />}
        onClick={() => setOpen(true)}
        size="small"
        style={{
          borderRadius: "var(--radius-md)",
        }}
      >
        {operation === "copy" ? "Copy" : "Move"}
      </Button>

      <Modal
        open={open}
        title={
          <Space>
            {operation === "copy" ? (
              <CopyOutlined style={{ color: "var(--color-primary)" }} />
            ) : (
              <ArrowRightOutlined style={{ color: "var(--color-primary)" }} />
            )}
            <span>{operation === "copy" ? "Copy" : "Move"} Course</span>
            {course && (
              <Text type="secondary" style={{ fontSize: 14 }}>
                - {course.name}
              </Text>
            )}
          </Space>
        }
        onCancel={() => {
          setOpen(false);
          setSelectedFolder(null);
        }}
        footer={
          <Space>
            <Button
              onClick={() => {
                setOpen(false);
                setSelectedFolder(null);
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              size="large"
              loading={loading}
              disabled={!selectedFolder}
              style={{
                borderRadius: "var(--radius-md)",
                fontWeight: 500,
                minWidth: 120,
              }}
            >
              {operation === "copy" ? "Copy" : "Move"}
            </Button>
          </Space>
        }
        width={600}
        destroyOnClose
      >
        <Alert
          message={
            operation === "copy"
              ? "Copy this course to another location. The original will remain unchanged."
              : "Move this course to another location. It will be removed from its current location."
          }
          type="info"
          showIcon
          style={{ marginBottom: "var(--spacing-lg)" }}
        />

        <div style={{ marginBottom: "var(--spacing-md)" }}>
          <Text strong>Select Destination Folder:</Text>
        </div>

        <TreeSelect
          style={{ width: "100%" }}
          value={selectedFolder}
          dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
          treeData={folderTree}
          placeholder="Select a folder..."
          treeDefaultExpandAll
          onChange={(value) => setSelectedFolder(value)}
          size="large"
        />

        {selectedFolder && (
          <Alert
            message={`Course will be ${operation === "copy" ? "copied" : "moved"} to the selected folder`}
            type="success"
            style={{ marginTop: "var(--spacing-md)" }}
          />
        )}
      </Modal>
    </>
  );
};

export default CopyMoveFolderModal;

