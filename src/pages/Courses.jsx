import React, { useEffect, useState } from "react";
import { Col, Row, Skeleton, Input, Empty, Space, Button, Tabs } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { CourseCard } from "../components/ui/CourseCard";
import NewCourseModal from "../components/ui/NewCourseModal";
import NewFolder from "../components/ui/NewFolder";
import useFolders from "../hooks/useFolders";
import { Link, useParams, useNavigate } from "react-router-dom";
import useMessageApi from "../hooks/useMessageApi";
import { handleKeyboardClick } from "../utils/accessibility";

function Courses(props) {
  const [loading, setLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [childrens, setChildrens] = useState([]);
  const [contents, setContents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const { getFolderAndContentsAndPermissions, saveFolder } = useFolders();
  const { contextHolder, showMessage } = useMessageApi();
  const { folderId } = useParams();
  const navigate = useNavigate();

  // Reload when folderId changes
  useEffect(() => {
    if (folderId) {
      loadFolderDetails(folderId);
    } else {
      setChildrens([]);
      setContents([]);
    }
  }, [folderId]);

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (folderId) {
      loadFolderDetails(folderId);
    } else {
      setChildrens([]);
      setContents([]);
    }
  }, [folderId]);

  const loadCourses = () => {
    setLoading(true);
    getFolderAndContentsAndPermissions(null)
      .then((res) => {
        console.log(res);
        setTree(() => res.children || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Failed to load courses");
      });
  };

  const loadFolderDetails = (id) => {
    setChildLoading(true);
    getFolderAndContentsAndPermissions(id)
      .then((res) => {
        console.log(res);
        setChildrens(() => res.children || []);
        setContents(() => res.contents || []);
        setChildLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setChildLoading(false);
        showMessage("error", "Failed to load course details");
      });
  };

  const filteredCourses = tree.filter((course) =>
    course.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCourseClick = (courseId) => {
    navigate(`/video-subtitles/folder-manager/${courseId}`);
  };

  const handleEditCourse = (course) => {
    // Edit functionality is now available via EditCourseModal
    // This can be triggered from CourseCard if needed
    showMessage("info", "Use the Edit button on the course card to edit");
  };

  const handleDeleteCourse = (course) => {
    // TODO: Implement delete functionality
    showMessage("info", "Delete functionality coming soon");
  };

  const tabItems = [
    {
      key: "courses",
      label: "All Courses",
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Col key={course.id} xs={24} sm={12} md={8} lg={6}>
                <CourseCard
                  course={course}
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteCourse}
                  showActions={true}
                />
              </Col>
            ))
          ) : !loading ? (
            <Col span={24}>
              <Empty
                description="No courses found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <NewFolder
                  folderId={null}
                  saveFolder={saveFolder}
                  setLoading={setLoading}
                />
              </Empty>
            </Col>
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                  <Skeleton active style={{ height: 300 }} />
                </Col>
              ))}
            </>
          )}
        </Row>
      ),
    },
  ];

  return (
    <div style={style} className="layout-bg mh-100vh p-5">
      {contextHolder}
      <div className="flex flex-between-center mb-5" style={{ flexWrap: "wrap", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <div>
          <h2 style={{ 
            margin: 0,
            marginBottom: "var(--spacing-xs)",
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)"
          }}>
            My Courses
          </h2>
          <p style={{ 
            margin: 0, 
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-base)"
          }}>
            Organize and manage your learning courses and content
          </p>
        </div>
        <Space>
          <Input
            placeholder="Search courses..."
            prefix={<SearchOutlined aria-hidden="true" />}
            style={{ width: "100%", maxWidth: 400 }}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            aria-label="Search courses"
          />
          <NewCourseModal
            folderId={null}
            saveFolder={saveFolder}
            setLoading={setLoading}
            onSuccess={loadCourses}
          />
        </Space>
      </div>

      {folderId ? (
        <div>
          <Button
            type="link"
            onClick={() => navigate("/video-subtitles/folder-manager")}
            style={{ marginBottom: "var(--spacing-md)" }}
            aria-label="Back to all courses"
          >
            ← Back to Courses
          </Button>
          
          {!childLoading ? (
            <div>
              {childrens.length > 0 && (
                <div style={{ marginBottom: "var(--spacing-xl)" }}>
                  <h3 style={{ marginBottom: "var(--spacing-md)" }}>Topics</h3>
                  <Row gutter={[16, 16]}>
                    {childrens.map((child) => (
                      <Col key={child.id} xs={24} sm={12} md={8} lg={6}>
                        <CourseCard
                          course={child}
                          onEdit={handleEditCourse}
                          onDelete={handleDeleteCourse}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {contents.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: "var(--spacing-md)" }}>Content Items</h3>
                  <Row gutter={[16, 16]}>
                    {contents.map((content) => (
                      <Col key={content.content_id} xs={24} sm={12} md={8}>
                        <Link
                          to={
                            content.type === "model"
                              ? `/models/${content.content_id}`
                              : `/video-subtitles/library/${content.content_id}`
                          }
                        >
                          <div
                            style={{
                              padding: "var(--spacing-md)",
                              border: "1px solid var(--color-neutral-300)",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                              transition: "all var(--transition-base)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--color-primary)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--color-neutral-300)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <h4 style={{ margin: 0, marginBottom: "var(--spacing-xs)" }}>
                              {content.title}
                            </h4>
                            <span
                              style={{
                                color: "var(--color-text-secondary)",
                                fontSize: "var(--font-size-sm)",
                              }}
                            >
                              {content.type}
                            </span>
                          </div>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {childrens.length === 0 && contents.length === 0 && (
                <Empty
                  description="This course has no topics or content yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      )}
    </div>
  );
}

export default Courses;

