import React, { useState, useEffect } from "react";
import { Col, Empty, Row, Skeleton, Input, Space, Tabs, Card, Statistic, Tag } from "antd";
import { 
  SearchOutlined, 
  TeamOutlined, 
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useClassrooms from "../hooks/useClassrooms";
import { ClassroomCard } from "../components/ui/ClassroomCard";
import CreateClassroomModal from "../components/ui/CreateClassroomModal";
import PendingRequestsCard from "../components/ui/PendingRequestsCard";
import useMessageApi from "../hooks/useMessageApi";

const isAuthorizationError = (errorMsg) => {
  return errorMsg.includes("neither classroom teacher or creator") || 
         errorMsg.includes("not student, teacher or creator");
};

function StaffRooms(props) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    teachers: 0,
    pendingRequests: 0,
  });
  const [classroomsWithRequests, setClassroomsWithRequests] = useState([]);
  const {
    getStaffClassrooms,
    createClassroom,
    updateClassroom,
    getClassStudents,
    getClassTeachers,
  } = useClassrooms();
  const navigate = useNavigate();
  const { contextHolder, showMessage } = useMessageApi();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    loadStaffRooms();
  }, []);

  const loadStaffRooms = async () => {
    setLoading(true);
    try {
      const res = await getStaffClassrooms("", 0, 99999);
      const rooms = res[0] || [];
      setClassrooms(rooms);

      // Calculate statistics
      let totalStudents = 0;
      let totalTeachers = 0;
      let totalPendingRequests = 0;
      const roomsWithRequests = [];

      for (const room of rooms) {
        try {
          let students = [];
          let teachers = [];
          let pendingStudents = [];
          let pendingTeachers = [];

          try {
            students = await getClassStudents(room.id, true); // approved
          } catch (err) {
            const errorMsg = err?.message || err?.toString() || "";
            if (isAuthorizationError(errorMsg)) {
              // This shouldn't happen for staff, but handle gracefully
              console.warn(`No permission to view students for room ${room.id}`);
            } else {
              console.log(`Error loading students for room ${room.id}:`, err);
            }
          }

          try {
            teachers = await getClassTeachers(room.id, true); // approved
          } catch (err) {
            const errorMsg = err?.message || err?.toString() || "";
            if (isAuthorizationError(errorMsg)) {
              // This shouldn't happen for staff, but handle gracefully
              console.warn(`No permission to view teachers for room ${room.id}`);
            } else {
              console.log(`Error loading teachers for room ${room.id}:`, err);
            }
          }

          try {
            pendingStudents = await getClassStudents(room.id, false); // pending
          } catch (err) {
            const errorMsg = err?.message || err?.toString() || "";
            if (isAuthorizationError(errorMsg)) {
              // This shouldn't happen for staff, but handle gracefully
              console.warn(`No permission to view pending students for room ${room.id}`);
            } else {
              console.log(`Error loading pending students for room ${room.id}:`, err);
            }
          }

          try {
            pendingTeachers = await getClassTeachers(room.id, false); // pending
          } catch (err) {
            const errorMsg = err?.message || err?.toString() || "";
            if (isAuthorizationError(errorMsg)) {
              // This shouldn't happen for staff, but handle gracefully
              console.warn(`No permission to view pending teachers for room ${room.id}`);
            } else {
              console.log(`Error loading pending teachers for room ${room.id}:`, err);
            }
          }

          totalStudents += students?.length || 0;
          totalTeachers += teachers?.length || 0;
          
          // Count pending requests
          const pending = pendingStudents?.filter((s) => !s.is_approved) || [];
          const pendingTeacherReqs = pendingTeachers?.filter((t) => !t.is_approved) || [];
          const roomPendingCount = pending.length + pendingTeacherReqs.length;
          
          if (roomPendingCount > 0) {
            totalPendingRequests += roomPendingCount;
            roomsWithRequests.push({
              ...room,
              pendingCount: roomPendingCount,
            });
          }
        } catch (err) {
          console.log(`Error loading stats for room ${room.id}:`, err);
        }
      }

      setStats({
        total: rooms.length,
        active: rooms.filter((r) => r.is_public).length,
        students: totalStudents,
        teachers: totalTeachers,
        pendingRequests: totalPendingRequests,
      });
      setClassroomsWithRequests(roomsWithRequests);

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      showMessage("error", "Failed to load staff rooms");
    }
  };

  const filteredClassrooms = classrooms.filter((classroom) =>
    classroom.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    classroom.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const tabItems = [
    {
      key: "all-rooms",
      label: (
        <Space>
          <BookOutlined aria-hidden="true" />
          All Rooms
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
                description="No staff rooms found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <CreateClassroomModal
                  createClassroom={createClassroom}
                  setLoading={setLoading}
                  onSuccess={loadStaffRooms}
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
      key: "public-rooms",
      label: (
        <Space>
          <CheckCircleOutlined aria-hidden="true" />
          Public Rooms
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredClassrooms.filter((c) => c.is_public).length > 0 ? (
            filteredClassrooms
              .filter((c) => c.is_public)
              .map((classroom) => (
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
              <Empty description="No public rooms" />
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
      key: "private-rooms",
      label: (
        <Space>
          <ClockCircleOutlined aria-hidden="true" />
          Private Rooms
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: "var(--spacing-md)" }}>
          {!loading && filteredClassrooms.filter((c) => !c.is_public).length > 0 ? (
            filteredClassrooms
              .filter((c) => !c.is_public)
              .map((classroom) => (
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
              <Empty description="No private rooms" />
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
            Staff Rooms
          </h2>
          <p style={{ 
            margin: 0, 
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-base)"
          }}>
            Manage your teaching classrooms and resources
          </p>
        </div>
        <Space>
          <Input
            placeholder="Search rooms..."
            prefix={<SearchOutlined aria-hidden="true" />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            aria-label="Search staff rooms"
          />
          <CreateClassroomModal
            createClassroom={createClassroom}
            setLoading={setLoading}
            onSuccess={loadStaffRooms}
          />
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: "var(--spacing-xl)" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Rooms"
              value={stats.total}
              prefix={<BookOutlined aria-hidden="true" />}
              valueStyle={{ color: "var(--color-primary)" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Public Rooms"
              value={stats.active}
              prefix={<CheckCircleOutlined aria-hidden="true" />}
              valueStyle={{ color: "var(--color-success)" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.students}
              prefix={<UserOutlined aria-hidden="true" />}
              valueStyle={{ color: "var(--color-info)" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Teachers"
              value={stats.teachers}
              prefix={<TeamOutlined aria-hidden="true" />}
              valueStyle={{ color: "var(--color-warning)" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Requests Overview */}
      {stats.pendingRequests > 0 && (
        <Row gutter={16} style={{ marginBottom: "var(--spacing-xl)" }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <PendingRequestsCard
              classroomId={null}
              onViewDetails={() => {
                // Navigate to first classroom with requests or show all
                if (classroomsWithRequests.length > 0) {
                  navigate(`/classroom/${classroomsWithRequests[0].id}?tab=requests`);
                }
              }}
            />
          </Col>
          {classroomsWithRequests.slice(0, 3).map((room) => (
            <Col key={room.id} xs={24} sm={12} md={8} lg={6}>
              <PendingRequestsCard
                classroomId={room.id}
                onViewDetails={() => navigate(`/classroom/${room.id}?tab=requests`)}
              />
            </Col>
          ))}
        </Row>
      )}

      <Tabs items={tabItems} defaultActiveKey="all-rooms" />
    </div>
  );
}

export default StaffRooms;

