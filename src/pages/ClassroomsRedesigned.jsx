import React, { useState, useEffect } from "react";
import { Col, Empty, Row, Skeleton, Input, Space, Tabs, Tag, Button } from "antd";
import { SearchOutlined, TeamOutlined, BookOutlined } from "@ant-design/icons";
import useClassrooms from "../hooks/useClassrooms";
import { ClassroomCard } from "../components/ui/ClassroomCard";
import CreateClassroomModal from "../components/ui/CreateClassroomModal";
import RequestClassroomAccess from "../components/ui/RequestClassroomAccess";
import useMessageApi from "../hooks/useMessageApi";
import useProfile from "../hooks/useProfile";

function ClassroomsRedesigned(props) {
  const [classrooms, setClassrooms] = useState([]);
  const [publicClassrooms, setPublicClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("my-classrooms");
  const [currentUserId, setCurrentUserId] = useState(null);
  const { 
    getStudentsClassrooms, 
    getStaffClassrooms,
    createClassroom,
    updateClassroom 
  } = useClassrooms();
  const { getUserProfile } = useProfile();
  const { contextHolder, showMessage } = useMessageApi();

  const { Search } = Input;
  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    loadClassrooms();
    // Get current user ID
    getUserProfile()
      .then((res) => {
        setCurrentUserId(res.id || res.user_id);
      })
      .catch((err) => console.error("Error getting user profile:", err));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "public-classrooms") {
      loadPublicClassrooms();
    }
  }, [activeTab]);

  const loadClassrooms = () => {
    if (activeTab === "public-classrooms") {
      return; // Public classrooms are loaded separately
    }
    setLoading(true);
    const loadFunction = activeTab === "my-classrooms" 
      ? getStudentsClassrooms 
      : getStaffClassrooms;

    loadFunction("", 0, 99999)
      .then((res) => {
        console.log(res);
        setLoading(false);
        if (activeTab === "my-classrooms") {
          setClassrooms(res[0] || []);
        } else {
          setClassrooms(res[0] || []);
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Failed to load classrooms");
      });
  };

  const loadPublicClassrooms = async () => {
    setLoading(true);
    try {
      // Try to get public classrooms by combining results from both endpoints
      // and filtering for public ones, or use a search that returns public classrooms
      const [studentsClassrooms, staffClassrooms] = await Promise.all([
        getStudentsClassrooms("", 0, 99999).catch(() => [[], []]),
        getStaffClassrooms("", 0, 99999).catch(() => [[], []]),
      ]);

      // Combine and filter for public classrooms
      const allClassrooms = [
        ...(studentsClassrooms[0] || []),
        ...(staffClassrooms[0] || [])
      ];

      // Remove duplicates and filter for public classrooms
      const uniquePublicClassrooms = allClassrooms
        .filter((classroom, index, self) => 
          index === self.findIndex((c) => c.id === classroom.id) && 
          (classroom.is_public === true || classroom.isPublic === true)
        );

      setPublicClassrooms(uniquePublicClassrooms);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      showMessage("error", "Failed to load public classrooms");
    }
  };

  const filteredClassrooms = (activeTab === "public-classrooms" ? publicClassrooms : classrooms).filter((classroom) =>
    classroom.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    classroom.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const tabItems = [
    {
      key: "my-classrooms",
      label: (
        <Space>
          <BookOutlined aria-hidden="true" />
          My Classrooms
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom) => (
              <Col key={classroom.id} xs={24} sm={12} md={8} lg={6}>
                <ClassroomCard
                  classroom={classroom}
                  updateClassroom={updateClassroom}
                  setLoading={setLoading}
                />
              </Col>
            ))
          ) : !loading ? (
            <Col span={24}>
              <Empty
                description="No classrooms found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <CreateClassroomModal
                  createClassroom={createClassroom}
                  setLoading={setLoading}
                  onSuccess={() => {
                    if (activeTab === "public-classrooms") {
                      loadPublicClassrooms();
                    } else {
                      loadClassrooms();
                    }
                  }}
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
    {
      key: "staff-classrooms",
      label: (
        <Space>
          <TeamOutlined aria-hidden="true" />
          Staff Classrooms
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom) => (
              <Col key={classroom.id} xs={24} sm={12} md={8} lg={6}>
                <ClassroomCard
                  classroom={classroom}
                  updateClassroom={updateClassroom}
                  setLoading={setLoading}
                />
              </Col>
            ))
          ) : !loading ? (
            <Col span={24}>
              <Empty
                description="No staff classrooms found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <CreateClassroomModal
                  createClassroom={createClassroom}
                  setLoading={setLoading}
                  onSuccess={loadClassrooms}
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
    {
      key: "public-classrooms",
      label: (
        <Space>
          <BookOutlined aria-hidden="true" />
          Public Classrooms
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom) => (
              <Col key={classroom.id} xs={24} sm={12} md={8} lg={6}>
                <ClassroomCard
                  classroom={classroom}
                  updateClassroom={updateClassroom}
                  setLoading={setLoading}
                  showRequestButton={true}
                  currentUserId={currentUserId}
                />
              </Col>
            ))
          ) : !loading ? (
            <Col span={24}>
              <Empty
                description="No public classrooms found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Space direction="vertical" size="middle">
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    Public classrooms will appear here. You can request access to join them.
                  </p>
                  <CreateClassroomModal
                    createClassroom={createClassroom}
                    setLoading={setLoading}
                    onSuccess={() => {
                      loadPublicClassrooms();
                    }}
                  />
                </Space>
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
      <div className="flex flex-between-center mb-5" style={{ flexWrap: "wrap", gap: "var(--spacing-md)" }}>
        <h2 style={{ margin: 0 }}>Classrooms</h2>
        <Space>
          <Search
            placeholder="Search classrooms..."
            prefix={<SearchOutlined aria-hidden="true" />}
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
            aria-label="Search classrooms"
          />
          <CreateClassroomModal
            createClassroom={createClassroom}
            setLoading={setLoading}
            onSuccess={() => {
              if (activeTab === "public-classrooms") {
                loadPublicClassrooms();
              } else {
                loadClassrooms();
              }
            }}
          />
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
}

export default ClassroomsRedesigned;

