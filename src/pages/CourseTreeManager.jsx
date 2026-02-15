import React, { useEffect, useState, useMemo } from "react";
import {
  Tree,
  Input,
  Space,
  Button,
  Dropdown,
  Modal,
  Empty,
  Tag,
  Card,
  Typography,
  Spin,
  Alert,
  Tooltip,
  Badge,
} from "antd";
import {
  SearchOutlined,
  FolderOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useFolders from "../hooks/useFolders";
import useMessageApi from "../hooks/useMessageApi";
import NewCourseModal from "../components/ui/NewCourseModal";
import EditCourseModal from "../components/ui/EditCourseModal";
import DeleteCourseModal from "../components/ui/DeleteCourseModal";
import CopyMoveFolderModal from "../components/ui/CopyMoveFolderModal";
import AddContentModal from "../components/ui/AddContentModal";

const { DirectoryTree } = Tree;
const { Text, Title } = Typography;

function CourseTreeManager(props) {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextMenuNode, setContextMenuNode] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isCopyOperation, setIsCopyOperation] = useState(false);
  const [hoveredNodeKey, setHoveredNodeKey] = useState(null);

  const { 
    getFolderAndContentsAndPermissions, 
    moveFolder,
    copyFolder,
    saveFolder,
    removeFolderContent,
    deleteFolder,
  } = useFolders();
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    loadTreeData();
  }, []);

  // Recursively build tree structure
  const buildTreeRecursive = async (parentId = null, level = 0, seenKeys = new Set()) => {
    try {
      const data = await getFolderAndContentsAndPermissions(parentId);
      const nodes = [];

      // Add child folders (sub-courses)
      if (data.children && data.children.length > 0) {
        for (const child of data.children) {
          const key = `folder-${child.id}`;
          if (seenKeys.has(key)) {
            console.warn(`Duplicate key detected: ${key}, skipping`);
            continue;
          }
          seenKeys.add(key);
          
          const childData = await getFolderAndContentsAndPermissions(child.id);
          const node = {
            title: child.name,
            key,
            id: child.id,
            type: "folder",
            isLeaf: false,
            icon: <FolderOutlined />,
            children: await buildTreeRecursive(child.id, level + 1, seenKeys),
            data: child,
            level,
          };
          nodes.push(node);
        }
      }

      // Add content items (subtitle videos and models)
      if (data.contents && data.contents.length > 0) {
        for (const content of data.contents) {
          const key = `content-${content.id || content.content_id}`;
          if (seenKeys.has(key)) {
            console.warn(`Duplicate key detected: ${key}, skipping`);
            continue;
          }
          seenKeys.add(key);
          
          const node = {
            title: content.title || content.name || `Untitled ${content.type}`,
            key,
            id: content.id || content.content_id,
            folderContentId: content.id,
            type: "content",
            contentType: content.type,
            isLeaf: true,
            icon: content.type === "model" ? (
              <RobotOutlined style={{ color: "#1890ff" }} />
            ) : (
              <PlayCircleOutlined style={{ color: "#52c41a" }} />
            ),
            data: content,
            level,
          };
          nodes.push(node);
        }
      }

      return nodes;
    } catch (error) {
      console.error("Error building tree:", error);
      return [];
    }
  };

  const loadTreeData = async () => {
    setLoading(true);
    // Clear tree data immediately to prevent duplicate keys during reload
    setTreeData([]);
    setExpandedKeys([]);
    setSelectedKeys([]);
    try {
      const rootData = await getFolderAndContentsAndPermissions(null);
      const tree = [];
      const seenKeys = new Set(); // Track keys to prevent duplicates

      // Build root level folders
      if (rootData.children && rootData.children.length > 0) {
        for (const folder of rootData.children) {
          const key = `folder-${folder.id}`;
          if (seenKeys.has(key)) {
            console.warn(`Duplicate key detected: ${key}, skipping`);
            continue;
          }
          seenKeys.add(key);
          
          const folderData = await getFolderAndContentsAndPermissions(folder.id);
          const node = {
            title: folder.name,
            key,
            id: folder.id,
            type: "folder",
            isLeaf: false,
            icon: <FolderOutlined />,
            children: await buildTreeRecursive(folder.id, 1, seenKeys),
            data: folder,
            level: 0,
          };
          tree.push(node);
        }
      }

      // Add root level content if any
      if (rootData.contents && rootData.contents.length > 0) {
        for (const content of rootData.contents) {
          const key = `content-${content.id || content.content_id}`;
          if (seenKeys.has(key)) {
            console.warn(`Duplicate key detected: ${key}, skipping`);
            continue;
          }
          seenKeys.add(key);
          
          const node = {
            title: content.title || content.name || `Untitled ${content.type}`,
            key,
            id: content.id || content.content_id,
            folderContentId: content.id,
            type: "content",
            contentType: content.type,
            isLeaf: true,
            icon: content.type === "model" ? (
              <RobotOutlined style={{ color: "#1890ff" }} />
            ) : (
              <PlayCircleOutlined style={{ color: "#52c41a" }} />
            ),
            data: content,
            level: 0,
          };
          tree.push(node);
        }
      }

      setTreeData(tree);
      // Auto-expand first level
      const firstLevelKeys = tree.map((node) => node.key);
      setExpandedKeys(firstLevelKeys);
    } catch (error) {
      console.error("Error loading tree data:", error);
      showMessage("error", "Failed to load course tree");
    } finally {
      setLoading(false);
    }
  };

  // Filter tree data based on search
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData;

    const filterTree = (nodes) => {
      return nodes
        .map((node) => {
          const match = node.title
            .toLowerCase()
            .includes(searchValue.toLowerCase());
          const filteredChildren = node.children
            ? filterTree(node.children)
            : [];

          if (match || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node) => node !== null);
    };

    return filterTree(treeData);
  }, [treeData, searchValue]);

  // Handle node selection
  const onSelect = (selectedKeys, info) => {
    setSelectedKeys(selectedKeys);
    if (info.node.type === "folder") {
      navigate(`/video-subtitles/folder-manager/${info.node.id}`);
    } else if (info.node.type === "content") {
      if (info.node.contentType === "model") {
        navigate(`/models/${info.node.id}`);
      } else {
        navigate(`/video-subtitles/library/${info.node.id}`);
      }
    }
  };

  // Handle expand/collapse
  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  // Context menu items
  const getContextMenuItems = (node) => {
    const items = [];

    if (node.type === "folder") {
      items.push(
        {
          key: "edit",
          label: "Edit Course",
          icon: <EditOutlined />,
        },
        {
          key: "add-subcourse",
          label: "Add Sub-Course",
          icon: <PlusOutlined />,
        },
        {
          key: "add-content",
          label: "Add Content",
          icon: <PlusOutlined />,
        },
        {
          type: "divider",
        },
        {
          key: "copy",
          label: "Copy",
          icon: <CopyOutlined />,
        },
        {
          key: "move",
          label: "Move",
          icon: <ScissorOutlined />,
        },
        {
          type: "divider",
        },
        {
          key: "delete",
          label: "Delete",
          icon: <DeleteOutlined />,
          danger: true,
        }
      );
    } else if (node.type === "content") {
      items.push(
        {
          key: "open",
          label: "Open",
          icon: <PlayCircleOutlined />,
        },
        {
          type: "divider",
        },
        {
          key: "remove",
          label: "Remove from Course",
          icon: <DeleteOutlined />,
          danger: true,
        }
      );
    }

    return items;
  };

  // Handle context menu click
  const handleContextMenuClick = async ({ key, node }) => {
    setContextMenuNode(node);
    setActionType(key);

    switch (key) {
      case "edit":
        // Edit modal will be handled by the EditCourseModal component
        break;
      case "delete":
        // Delete will be handled by DeleteCourseModal
        break;
      case "remove":
        if (node.folderContentId) {
          Modal.confirm({
            title: "Remove Content",
            content: `Are you sure you want to remove "${node.title}" from this course?`,
            okText: "Remove",
            okType: "danger",
            onOk: async () => {
              try {
                await removeFolderContent(node.folderContentId);
                showMessage("success", "Content removed successfully");
                loadTreeData();
              } catch (error) {
                showMessage("error", "Failed to remove content");
              }
            },
          });
        }
        break;
      case "open":
        if (node.contentType === "model") {
          navigate(`/models/${node.id}`);
        } else {
          navigate(`/video-subtitles/library/${node.id}`);
        }
        break;
      default:
        // For other actions, the modals will be rendered and can be triggered
        break;
    }
  };

  const handleModalSuccess = () => {
    loadTreeData();
    setContextMenuNode(null);
    setActionType(null);
  };

  // Handle drag start
  const onDragStart = (info) => {
    setDraggedNode(info.node);
    // Check if Ctrl/Cmd key is pressed for copy operation
    const event = info.event?.nativeEvent || window.event;
    setIsCopyOperation(event?.ctrlKey || event?.metaKey || false);
  };

  // Handle drop
  const onDrop = async (info) => {
    if (!draggedNode) return;
    
    const dropKey = info.node.key;
    const dragKey = draggedNode.key;
    const dropPos = info.node.pos.split("-");
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    // Check if Ctrl/Cmd key is pressed (for copy operation)
    const event = info.event?.nativeEvent || info.event;
    const isCopy = isCopyOperation || event?.ctrlKey || event?.metaKey || false;

    // Don't allow dropping on itself
    if (dragKey === dropKey) {
      showMessage("warning", `Cannot ${isCopy ? 'copy' : 'move'} item to itself`);
      return;
    }

    // Only allow moving/copying folders for now
    if (draggedNode.type !== "folder") {
      showMessage("warning", `Only folders can be ${isCopy ? 'copied' : 'moved'}`);
      return;
    }

    const targetNode = info.node;
    if (targetNode.type !== "folder") {
      showMessage("warning", "Can only drop on folders");
      return;
    }

    const action = isCopy ? "Copy" : "Move";
    const actionPast = isCopy ? "copied" : "moved";

    Modal.confirm({
      title: `${action} Course`,
      content: `${action} "${draggedNode.title}" to "${targetNode.title}"?`,
      onOk: async () => {
        try {
          console.log(`[CourseTreeManager] ${action} operation:`, {
            isCopy,
            sourceFolderId: draggedNode.id,
            targetFolderId: targetNode.id,
            action,
          });
          
          if (isCopy) {
            console.log(`[CourseTreeManager] Calling copyFolder(${draggedNode.id}, ${targetNode.id})`);
            await copyFolder(draggedNode.id, targetNode.id);
            showMessage("success", `Course ${actionPast} successfully`);
          } else {
            console.log(`[CourseTreeManager] Calling moveFolder(${draggedNode.id}, ${targetNode.id})`);
            await moveFolder(draggedNode.id, targetNode.id);
            showMessage("success", `Course ${actionPast} successfully`);
          }
          setDraggedNode(null);
          setIsCopyOperation(false);
          await loadTreeData();
        } catch (error) {
          console.error(`Error ${actionPast.toLowerCase()} folder:`, error);
          showMessage("error", `Failed to ${actionPast.toLowerCase()} course`);
          setDraggedNode(null);
          setIsCopyOperation(false);
        }
      },
      onCancel: () => {
        setDraggedNode(null);
        setIsCopyOperation(false);
      },
    });
  };

  // Render tree title with modern inline actions
  const renderTitle = (node) => {
    const menuItems = getContextMenuItems(node);
    const isHovered = hoveredNodeKey === node.key;
    const isFolder = node.type === "folder";
    const isExpanded = expandedKeys.includes(node.key);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingRight: "8px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={() => setHoveredNodeKey(node.key)}
        onMouseLeave={() => setHoveredNodeKey(null)}
      >
        <Space style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontWeight: isFolder ? 500 : 400,
              color: isFolder ? "#1890ff" : "inherit",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.title}
          </span>
          {node.type === "content" && (
            <Tag
              color={node.contentType === "model" ? "blue" : "green"}
              size="small"
              style={{ margin: 0 }}
            >
              {node.contentType}
            </Tag>
          )}
        </Space>
        
        {/* Modern inline action buttons */}
        <Space
          size="small"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            marginLeft: "8px",
          }}
        >
          {isFolder && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuNode(node);
                    setActionType("edit");
                  }}
                  style={{
                    padding: "4px 8px",
                    height: "24px",
                    color: "#1890ff",
                  }}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuNode(node);
                    setActionType("delete");
                  }}
                  style={{
                    padding: "4px 8px",
                    height: "24px",
                  }}
                />
              </Tooltip>
            </>
          )}
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => handleContextMenuClick({ key, node }),
            }}
            trigger={["click"]}
          >
            <Tooltip title="More actions">
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  padding: "4px 8px",
                  height: "24px",
                  opacity: isHovered ? 0.7 : 0.4,
                }}
              />
            </Tooltip>
          </Dropdown>
        </Space>
      </div>
    );
  };

  // Count items for stats
  const stats = useMemo(() => {
    const countItems = (nodes) => {
      let folders = 0;
      let contents = 0;
      nodes.forEach((node) => {
        if (node.type === "folder") {
          folders++;
          if (node.children) {
            const childStats = countItems(node.children);
            folders += childStats.folders;
            contents += childStats.contents;
          }
        } else {
          contents++;
        }
      });
      return { folders, contents };
    };
    return countItems(treeData);
  }, [treeData]);

  return (
    <div 
      style={{
        ...style,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      {contextHolder}

      {/* Modern Header with Gradient */}
      <Card
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
        }}
        bodyStyle={{ padding: "24px 32px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "28px",
              }}
            >
              Course Tree Manager
            </Title>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                display: "block",
                marginTop: "4px",
              }}
            >
              Organize and manage your courses, sub-courses, and content
            </Text>
            {treeData.length > 0 && (
              <Space style={{ marginTop: "12px" }}>
                <Badge
                  count={stats.folders}
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                >
                  <Text style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <FolderOpenOutlined /> Courses
                  </Text>
                </Badge>
                <Badge
                  count={stats.contents}
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                >
                  <Text style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <FileTextOutlined /> Content
                  </Text>
                </Badge>
              </Space>
            )}
          </div>
          <Space>
            <Input
              placeholder="Search courses and content..."
              prefix={<SearchOutlined />}
              style={{
                width: 300,
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTreeData}
              loading={loading}
              style={{
                borderRadius: "8px",
                border: "none",
                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                backdropFilter: "blur(10px)",
              }}
            >
              Refresh
            </Button>
            <NewCourseModal
              folderId={null}
              saveFolder={saveFolder}
              setLoading={setLoading}
              onSuccess={loadTreeData}
            />
          </Space>
        </div>
      </Card>

      {/* Modern Drag and Drop Tips */}
      <Alert
        message="💡 Drag & Drop Tips"
        description={
          <div>
            <Text>
              <strong>Move:</strong> Drag a folder to move it to another location.
              <br />
              <strong>Copy:</strong> Hold <kbd style={{ 
                padding: "2px 6px", 
                background: "rgba(102, 126, 234, 0.1)", 
                border: "1px solid rgba(102, 126, 234, 0.3)", 
                borderRadius: "4px",
                fontSize: "12px",
                color: "#667eea",
                fontWeight: 600,
              }}>Ctrl</kbd> (Windows/Linux) or <kbd style={{ 
                padding: "2px 6px", 
                background: "rgba(102, 126, 234, 0.1)", 
                border: "1px solid rgba(102, 126, 234, 0.3)", 
                borderRadius: "4px",
                fontSize: "12px",
                color: "#667eea",
                fontWeight: 600,
              }}>Cmd</kbd> (Mac) while dragging to copy instead of move.
            </Text>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{
          marginBottom: 24,
          borderRadius: "12px",
          border: "1px solid #e0e7ff",
          background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
        }}
        closable
      />

      {/* Modern Tree View Card */}
      <Card
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px", color: "#8c8c8c" }}>
              Loading course tree...
            </div>
          </div>
        ) : filteredTreeData.length > 0 ? (
          <DirectoryTree
            multiple
            defaultExpandAll={false}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onSelect={onSelect}
            onExpand={onExpand}
            treeData={filteredTreeData}
            titleRender={renderTitle}
            draggable
            onDragStart={onDragStart}
            onDrop={onDrop}
            blockNode
            style={{
              fontSize: "14px",
              minHeight: "400px",
            }}
          />
        ) : (
          <Empty
            description={
              searchValue
                ? "No results found"
                : "No courses found. Create your first course to get started!"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "60px 0" }}
          >
            {!searchValue && (
              <NewCourseModal
                folderId={null}
                saveFolder={saveFolder}
                setLoading={setLoading}
                onSuccess={loadTreeData}
              />
            )}
          </Empty>
        )}
      </Card>

      {/* Modern Action Panel - shown when a node is selected */}
      {contextMenuNode && contextMenuNode.type === "folder" && (
        <Card
          style={{
            marginTop: 24,
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e8e8e8",
            background: "linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                Actions for: {contextMenuNode.title}
              </Text>
              <div style={{ marginTop: "4px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <FolderOutlined /> Course Management
                </Text>
              </div>
            </div>
            <Space wrap>
              <EditCourseModal
                course={contextMenuNode.data}
                onSuccess={handleModalSuccess}
              />
              <DeleteCourseModal
                course={contextMenuNode.data}
                onSuccess={handleModalSuccess}
              />
              <CopyMoveFolderModal
                folderId={contextMenuNode.id}
                course={contextMenuNode.data}
                operation="copy"
                onSuccess={handleModalSuccess}
              />
              <CopyMoveFolderModal
                folderId={contextMenuNode.id}
                course={contextMenuNode.data}
                operation="move"
                onSuccess={handleModalSuccess}
              />
              <NewCourseModal
                folderId={contextMenuNode.id}
                saveFolder={saveFolder}
                setLoading={setLoading}
                onSuccess={handleModalSuccess}
              />
              <AddContentModal
                folderId={contextMenuNode.id}
                onSuccess={handleModalSuccess}
              />
              <Button
                onClick={() => {
                  setContextMenuNode(null);
                  setActionType(null);
                }}
                style={{ borderRadius: "8px" }}
              >
                Clear Selection
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  );
}

export default CourseTreeManager;
