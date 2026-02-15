import React, { useEffect, useState } from "react";
import {
  Col,
  Row,
  Skeleton,
  Empty,
  Space,
  Button,
  Card,
  Tag,
  Breadcrumb,
  Divider,
  List,
  Avatar,
  Typography,
} from "antd";
import {
  HomeOutlined,
  FolderOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import AddContentModal from "../components/ui/AddContentModal";
import NewCourseModal from "../components/ui/NewCourseModal";
import EditCourseModal from "../components/ui/EditCourseModal";
import DeleteCourseModal from "../components/ui/DeleteCourseModal";
import FolderPermissionsModal from "../components/ui/FolderPermissionsModal";
import CopyMoveFolderModal from "../components/ui/CopyMoveFolderModal";
import AITutor from "../components/ui/AITutor";
import AIContentGenerator from "../components/ui/AIContentGenerator";
import useFolders from "../hooks/useFolders";
import useMessageApi from "../hooks/useMessageApi";
import useSubtitleVideos from "../hooks/useSubtitleVideos";
import { CourseCard } from "../components/ui/CourseCard";

const { Title, Text, Paragraph } = Typography;

function CourseDetail(props) {
  const [loading, setLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [childrens, setChildrens] = useState([]);
  const [contents, setContents] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const { getFolderAndContentsAndPermissions, saveFolder, removeFolderContent } = useFolders();
  const { getMyVideoRecordings } = useSubtitleVideos();
  const { contextHolder, showMessage } = useMessageApi();
  const { folderId } = useParams();
  const navigate = useNavigate();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    loadAllCourses();
  }, []);

  useEffect(() => {
    if (folderId) {
      loadCourseDetails(folderId);
    } else {
      setChildrens([]);
      setContents([]);
      setCurrentCourse(null);
      setBreadcrumbs([]);
    }
  }, [folderId]);

  const loadAllCourses = () => {
    setLoading(true);
    getFolderAndContentsAndPermissions(null)
      .then((res) => {
        setTree(() => res.children || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Failed to load courses");
      });
  };

  const loadCourseDetails = async (id) => {
    setChildLoading(true);
    try {
      const res = await getFolderAndContentsAndPermissions(id);
      setChildrens(() => res.children || []);
      const contentsList = res.contents || [];
      setContents(() => contentsList);
      
      // Set current course info
      const course = {
        id: res.id,
        name: res.name,
        description: res.description,
        image: res.image,
        is_public: res.is_public,
        parentId: res.parent_id, // Store parent_id for update operations
        children: res.children || [],
        contents: contentsList,
      };
      setCurrentCourse(course);

      // Load thumbnails for subtitle videos
      await loadVideoThumbnails(contentsList);

      // Build breadcrumbs
      buildBreadcrumbs(id, res.name);
      
      setChildLoading(false);
    } catch (err) {
      console.log(err);
      setChildLoading(false);
      showMessage("error", "Failed to load course details");
    }
  };

  const loadVideoThumbnails = async (contentsList) => {
    // Extract video content IDs
    const videoContentIds = contentsList
      .filter((item) => item.type === "recording" || item.type === "video")
      .map((item) => item.content_id);

    if (videoContentIds.length === 0) {
      return;
    }

    try {
      // Fetch all videos to get their URLs
      const allVideos = await getMyVideoRecordings("", 0, 99999);
      const videos = allVideos[0] || [];
      
      // Create a map of video ID to thumbnail URL
      const thumbnailMap = {};
      const regex = /embed\/([^\?]+)/i; // Regex to get VideoID from YouTube embed link

      videos.forEach((video) => {
        if (videoContentIds.includes(video.id) && video.original_video_url) {
          const match = video.original_video_url.match(regex);
          if (match && match[1]) {
            const videoId = match[1];
            thumbnailMap[video.id] = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      });

      setVideoThumbnails(thumbnailMap);
    } catch (err) {
      console.log("Error loading video thumbnails:", err);
      // Don't show error to user, just continue without thumbnails
    }
  };

  const buildBreadcrumbs = (id, name) => {
    // For now, simple breadcrumb. Can be enhanced to show full path
    setBreadcrumbs([
      {
        title: (
          <Link to="/video-subtitles/folder-manager">
            <HomeOutlined /> Courses
          </Link>
        ),
      },
      {
        title: name,
      },
    ]);
  };

  const handleRefresh = () => {
    if (folderId) {
      loadCourseDetails(folderId);
    } else {
      loadAllCourses();
    }
  };

  const getContentIcon = (type) => {
    return type === "model" ? (
      <RobotOutlined style={{ color: "var(--color-primary)" }} />
    ) : (
      <PlayCircleOutlined style={{ color: "var(--color-success)" }} />
    );
  };

  const getContentTypeColor = (type) => {
    return type === "model" ? "blue" : "green";
  };

  return (
    <div style={style} className="layout-bg mh-100vh p-5">
      {contextHolder}
      
      {/* Breadcrumbs */}
      {folderId && currentCourse && (
        <Breadcrumb
          items={breadcrumbs}
          style={{ marginBottom: "var(--spacing-lg)" }}
        />
      )}

      {/* Header Section */}
      <div
        className="flex flex-between-center mb-5"
        style={{ flexWrap: "wrap", gap: "var(--spacing-md)" }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          {folderId && currentCourse ? (
            <>
              <div className="flex align-items-center" style={{ gap: "var(--spacing-md)", marginBottom: "var(--spacing-sm)" }}>
                {currentCourse.image && (
                  <Avatar
                    src={currentCourse.image}
                    icon={<FolderOutlined />}
                    size={64}
                    shape="square"
                    style={{ borderRadius: "var(--radius-md)" }}
                  />
                )}
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    {currentCourse.name}
                  </Title>
                  {currentCourse.is_public !== undefined && (
                    <Tag
                      icon={currentCourse.is_public ? <BookOutlined /> : <FileTextOutlined />}
                      color={currentCourse.is_public ? "success" : "default"}
                      style={{ marginTop: "var(--spacing-xs)" }}
                    >
                      {currentCourse.is_public ? "Public" : "Private"}
                    </Tag>
                  )}
                </div>
              </div>
              {currentCourse.description && (
                <Paragraph
                  style={{
                    color: "var(--color-text-secondary)",
                    marginTop: "var(--spacing-sm)",
                  }}
                >
                  {currentCourse.description}
                </Paragraph>
              )}
            </>
          ) : (
            <Title level={2} style={{ margin: 0 }}>
              My Courses
            </Title>
          )}
        </div>

        <Space>
          {folderId && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/video-subtitles/folder-manager")}
            >
              Back to Courses
            </Button>
          )}
          {folderId && currentCourse && (
            <Space>
              <EditCourseModal
                course={currentCourse}
                onSuccess={() => {
                  if (folderId) {
                    loadCourseDetails(folderId);
                  }
                }}
              />
              <DeleteCourseModal
                course={currentCourse}
                onSuccess={() => {
                  navigate("/video-subtitles/folder-manager");
                }}
              />
              <FolderPermissionsModal
                folderId={folderId}
                course={currentCourse}
                onSuccess={() => {
                  if (folderId) {
                    loadCourseDetails(folderId);
                  }
                }}
              />
              <CopyMoveFolderModal
                folderId={folderId}
                course={currentCourse}
                operation="copy"
                onSuccess={() => {
                  if (folderId) {
                    loadCourseDetails(folderId);
                  } else {
                    loadAllCourses();
                  }
                }}
              />
              <CopyMoveFolderModal
                folderId={folderId}
                course={currentCourse}
                operation="move"
                onSuccess={() => {
                  navigate("/video-subtitles/folder-manager");
                }}
              />
            </Space>
          )}
          {folderId && (
            <AddContentModal
              folderId={folderId}
              onSuccess={() => {
                if (folderId) {
                  loadCourseDetails(folderId);
                }
              }}
            />
          )}
          <NewCourseModal
            folderId={folderId}
            saveFolder={saveFolder}
            setLoading={setLoading}
            onSuccess={() => {
              if (folderId) {
                loadCourseDetails(folderId);
              } else {
                loadAllCourses();
              }
            }}
          />
        </Space>
      </div>

      <Divider />

      {/* Content Section */}
      {folderId ? (
        // Course Detail View
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            {childLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <>
                {/* Topics Section */}
                {childrens.length > 0 && (
                  <div style={{ marginBottom: "var(--spacing-xl)" }}>
                    <div
                      className="flex flex-between-center"
                      style={{ marginBottom: "var(--spacing-md)" }}
                    >
                      <Title level={4} style={{ margin: 0 }}>
                        <FolderOutlined style={{ marginRight: "var(--spacing-xs)" }} />
                        Topics ({childrens.length})
                      </Title>
                    </div>
                    <Row gutter={[16, 16]}>
                      {childrens.map((child, index) => (
                        <Col key={`child-${child.id || child.folder_id || index}`} xs={24} sm={12} md={8} lg={6}>
                          <CourseCard
                            course={child}
                            showActions={false}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {/* Content Items Section */}
              {contents.length > 0 && (
                <div>
                  <div
                    className="flex flex-between-center"
                    style={{ marginBottom: "var(--spacing-md)" }}
                  >
                    <Title level={4} style={{ margin: 0 }}>
                      <FileTextOutlined style={{ marginRight: "var(--spacing-xs)" }} />
                      Content Items ({contents.length})
                    </Title>
                  </div>
                  <List
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 1,
                      md: 2,
                      lg: 2,
                      xl: 3,
                    }}
                    dataSource={contents}
                    renderItem={(item, index) => (
                      <List.Item key={`content-${item.type}-${item.id || item.content_id || index}`}>
                        <Card
                          hoverable
                          style={{
                            width: "100%",
                            transition: "all var(--transition-base)",
                          }}
                          cover={
                            (item.type === "recording" || item.type === "video") &&
                            videoThumbnails[item.content_id] ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "200px",
                                  overflow: "hidden",
                                  backgroundColor: "var(--color-neutral-200)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={videoThumbnails[item.content_id]}
                                  alt={item.title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    // Fallback to icon if thumbnail fails to load
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            ) : null
                          }
                          actions={[
                            <Link
                              to={
                                item.type === "model"
                                  ? `/models/${item.content_id}`
                                  : `/video-subtitles/library/${item.content_id}`
                              }
                            >
                              <Button type="link" icon={<ArrowLeftOutlined />}>
                                Open
                              </Button>
                            </Link>,
                            <Button
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Remove "${item.title}" from this course?`)) {
                                  try {
                                    await removeFolderContent(item.id);
                                    showMessage("success", "Content removed successfully");
                                    loadCourseDetails(folderId);
                                  } catch (err) {
                                    showMessage("error", "Failed to remove content");
                                  }
                                }
                              }}
                            >
                              Remove
                            </Button>,
                          ]}
                        >
                          <Card.Meta
                            avatar={
                              !((item.type === "recording" || item.type === "video") && videoThumbnails[item.content_id]) ? (
                                <Avatar
                                  icon={getContentIcon(item.type)}
                                  size={48}
                                  style={{
                                    backgroundColor:
                                      item.type === "model"
                                        ? "var(--color-primary-light)"
                                        : "var(--color-success-light)",
                                  }}
                                />
                              ) : null
                            }
                            title={
                              <Space>
                                <Text strong>{item.title}</Text>
                                <Tag color={getContentTypeColor(item.type)}>
                                  {item.type === "model" ? "Model" : "Video"}
                                </Tag>
                              </Space>
                            }
                            description={
                              <Text type="secondary" ellipsis>
                                {item.type === "model"
                                  ? "Gesture Recognition Model"
                                  : "Video with Subtitles"}
                              </Text>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {/* Empty State */}
              {childrens.length === 0 && contents.length === 0 && (
                <Empty
                  description={
                    <div>
                      <Text type="secondary">
                        This course has no topics or content yet.
                      </Text>
                      <br />
                      <Space style={{ marginTop: "var(--spacing-md)" }}>
                        <NewCourseModal
                          folderId={folderId}
                          saveFolder={saveFolder}
                          setLoading={setLoading}
                          onSuccess={() => {
                            if (folderId) {
                              loadCourseDetails(folderId);
                            }
                          }}
                        />
                        <AddContentModal
                          folderId={folderId}
                          onSuccess={() => {
                            if (folderId) {
                              loadCourseDetails(folderId);
                            }
                          }}
                        />
                      </Space>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}

              {/* AI Course Assistant Section */}
              <div style={{ marginTop: "var(--spacing-xl)" }}>
                <Card
                  title={
                    <Space>
                      <RobotOutlined style={{ color: "var(--color-primary)" }} />
                      <Text strong>AI Course Assistant</Text>
                    </Space>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <AIContentGenerator
                        targetType="course"
                        targetId={folderId}
                        contentType="description"
                        existingContent={currentCourse?.description || ""}
                        onContentApproved={(content) => {
                          if (folderId) {
                            loadCourseDetails(folderId);
                          }
                        }}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <AIContentGenerator
                        targetType="course"
                        targetId={folderId}
                        contentType="outline"
                        existingContent=""
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
            </>
          )}
          </Col>

          {/* Sidebar with AI Tutor */}
          <Col xs={24} lg={8}>
            <AITutor
              conversationType="tutor"
              contextType="course"
              contextId={folderId}
              title="Course AI Tutor"
              style={{ position: "sticky", top: "24px" }}
            />
          </Col>
        </Row>
      ) : (
        // All Courses View
        <div>
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                  <Skeleton active style={{ height: 300 }} />
                </Col>
              ))}
            </Row>
          ) : tree.length > 0 ? (
            <Row gutter={[16, 16]}>
              {tree.map((course, index) => (
                <Col key={`course-${course.id || course.folder_id || index}`} xs={24} sm={12} md={8} lg={6}>
                  <CourseCard course={course} showActions={true} />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              description="No courses found. Create your first course to get started!"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <NewCourseModal
                folderId={null}
                saveFolder={saveFolder}
                setLoading={setLoading}
                onSuccess={loadAllCourses}
              />
            </Empty>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseDetail;

