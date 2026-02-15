import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  List,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Card,
  Divider,
  Badge,
} from "antd";
import {
  DownOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import useClassrooms from "../hooks/useClassrooms";
import AddTeacherToClass from "../components/ui/AddTeacherToClass";
import AddStudentToClass from "../components/ui/AddStudentToClass";
import RemoveStudentFromClass from "../components/ui/RemoveStudentFromClass";
import RemoveTeacherFromClass from "../components/ui/RemoveTeacherFromClass";
import UpdateClassroom from "../components/ui/UpdateClassroom";
import ApproveClassroomRequest from "../components/ui/ApproveClassroomRequest";
import RequestClassroomAccess from "../components/ui/RequestClassroomAccess";
import useMessageApi from "../hooks/useMessageApi";
import useProfile from "../hooks/useProfile";

const ClassroomDetail = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classroomInfo, setClassroomInfo] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const {
    addTeacherToClass,
    addStudentToClass,
    removeStudentFromClass,
    removeTeacherFromClass,
    updateClassroom,
    getClassStudents,
    getClassTeachers,
    getStaffClassrooms,
    getStudentsClassrooms,
  } = useClassrooms();
  const { getUserInfo } = useProfile();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadClassroomData();
  }, [classroomId]);

  const loadClassroomData = async () => {
    setLoading(true);
    setPendingRequestsCount(0); // Reset count
    try {
      // Load classroom info - try staff classrooms first, then student classrooms
      let classroom = null;
      let userIsStaff = false;
      try {
        const staffClassrooms = await getStaffClassrooms("", 0, 99999);
        classroom = staffClassrooms[0]?.find((c) => c.id === parseInt(classroomId));
        userIsStaff = !!classroom;
        setIsStaff(userIsStaff);
      } catch (err) {
        console.log("Error loading staff classrooms:", err);
      }

      // If not found in staff classrooms, try student classrooms
      if (!classroom) {
        try {
          const studentClassrooms = await getStudentsClassrooms("", 0, 99999);
          classroom = studentClassrooms[0]?.find((c) => c.id === parseInt(classroomId));
        } catch (err) {
          console.log("Error loading student classrooms:", err);
        }
      }

      setClassroomInfo(classroom);

      // Load creator information if available
      if (classroom?.create_user) {
        try {
          const creator = await getUserInfo(classroom.create_user);
          setCreatorInfo(creator);
        } catch (err) {
          console.log("Error loading creator info:", err);
          // Set basic info from classroom data
          setCreatorInfo({ username: classroom.create_user });
        }
      }

      // Load students and teachers (both approved and pending)
      // Handle errors gracefully - some users may not have permission to view all data
      let allStudents = [];
      let allTeachers = [];
      let approvedStudentsData = [];
      let approvedTeachersData = [];
      let hasShownPermissionMessage = false;

      const isAuthorizationError = (errorMsg) => {
        return errorMsg.includes("neither classroom teacher or creator") || 
               errorMsg.includes("not student, teacher or creator");
      };

      try {
        allStudents = await getClassStudents(classroomId, false); // Get pending requests
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          // Only show message once if user doesn't have permission
          if (!hasShownPermissionMessage && !userIsStaff) {
            showMessage("info", "You don't have permission to view pending requests. Only teachers and creators can see them.");
            hasShownPermissionMessage = true;
          }
        } else {
          console.error("Error loading pending students:", err);
        }
      }

      try {
        allTeachers = await getClassTeachers(classroomId, false); // Get pending requests
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          // Message already shown above
        } else {
          console.error("Error loading pending teachers:", err);
        }
      }

      try {
        approvedStudentsData = await getClassStudents(classroomId, true); // Get approved students
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          if (!hasShownPermissionMessage) {
            showMessage("warning", "You don't have permission to view students in this classroom.");
            hasShownPermissionMessage = true;
          }
        } else {
          console.error("Error loading approved students:", err);
          showMessage("error", "Failed to load students");
        }
      }

      try {
        approvedTeachersData = await getClassTeachers(classroomId, true); // Get approved teachers
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        if (isAuthorizationError(errorMsg)) {
          if (!hasShownPermissionMessage) {
            showMessage("warning", "You don't have permission to view teachers in this classroom.");
            hasShownPermissionMessage = true;
          }
        } else {
          console.error("Error loading approved teachers:", err);
          showMessage("error", "Failed to load teachers");
        }
      }

      // Separate approved and pending
      const approvedStudents = approvedStudentsData || [];
      const pendingStudents = (allStudents || []).filter((s) => !s.is_approved);
      const approvedTeachers = approvedTeachersData || [];
      const pendingTeachers = (allTeachers || []).filter((t) => !t.is_approved);

      setStudents(approvedStudents);
      setTeachers(approvedTeachers);
      setPendingRequestsCount(pendingStudents.length + pendingTeachers.length);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      showMessage("error", "Failed to load classroom data");
    }
  };

  const handleApprovalChange = () => {
    loadClassroomData();
  };

  const items = isStaff
    ? [
        {
          label: (
            <AddTeacherToClass
              setLoading={setLoading}
              classroomId={classroomId}
              addTeacherToClass={addTeacherToClass}
            />
          ),
          key: "1",
          icon: <UserOutlined />,
        },
        {
          label: (
            <AddStudentToClass
              setLoading={setLoading}
              classroomId={classroomId}
              addStudentToClass={addStudentToClass}
            />
          ),
          key: "2",
          icon: <UserOutlined />,
        },
        {
          label: (
            <RemoveStudentFromClass
              setLoading={setLoading}
              classroomId={classroomId}
              removeStudentFromClass={removeStudentFromClass}
            />
          ),
          key: "3",
          icon: <UserOutlined />,
          danger: true,
        },
        {
          label: (
            <RemoveTeacherFromClass
              setLoading={setLoading}
              classroomId={classroomId}
              removeTeacherFromClass={removeTeacherFromClass}
            />
          ),
          key: "4",
          icon: <UserOutlined />,
          danger: true,
        },
        {
          label: (
            <UpdateClassroom
              updateClassroom={updateClassroom}
              setLoading={setLoading}
            />
          ),
          key: "5",
          icon: <SettingOutlined />,
        },
      ]
    : [];

  const menuProps = items.length > 0 ? { items } : null;

  const tabItems = [
    {
      key: "students",
      label: (
        <Space>
          <UserOutlined aria-hidden="true" />
          Students
          {students.length > 0 && (
            <Badge count={students.length} showZero style={{ backgroundColor: "#52c41a" }} />
          )}
        </Space>
      ),
      children: (
        <div>
          {students.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={students}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={
                          item.sm_img
                            ? item.sm_img
                            : `https://randomuser.me/api/portraits/${
                                index % 2 === 0 ? "men" : "women"
                              }/${index}.jpg`
                        }
                      />
                    }
                    title={
                      <Link
                        to={`/profile/${item.fullname}`}
                        style={{ marginTop: "0" }}
                      >
                        {item.fullname ? item.fullname : "TalkMotion User"}
                      </Link>
                    }
                    description={
                      <Space>
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          Active
                        </Tag>
                        {item.email && <span>{item.email}</span>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No students in this classroom" />
          )}
        </div>
      ),
    },
    {
      key: "teachers",
      label: (
        <Space>
          <TeamOutlined aria-hidden="true" />
          Teachers
          {teachers.length > 0 && (
            <Badge count={teachers.length} showZero style={{ backgroundColor: "#1890ff" }} />
          )}
        </Space>
      ),
      children: (
        <div>
          {teachers.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={teachers}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={
                          item.sm_img
                            ? item.sm_img
                            : `https://randomuser.me/api/portraits/${
                                index % 2 === 0 ? "men" : "women"
                              }/${index}.jpg`
                        }
                      />
                    }
                    title={
                      <Link
                        to={`/profile/${item.fullname || item.username}`}
                        style={{ marginTop: "0" }}
                      >
                        {item.fullname || item.username || "TalkMotion User"}
                      </Link>
                    }
                    description={
                      <Space>
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          Teacher
                        </Tag>
                        {item.email && <span>{item.email}</span>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No teachers in this classroom" />
          )}
        </div>
      ),
    },
    ...(isStaff
      ? [
          {
            key: "requests",
            label: (
              <Space>
                <ClockCircleOutlined aria-hidden="true" />
                <Badge count={pendingRequestsCount} offset={[8, 0]}>
                  Pending Requests
                </Badge>
              </Space>
            ),
            children: (
              <div>
                <Card
                  title="Student Requests"
                  style={{ marginBottom: "var(--spacing-md)" }}
                >
                  <ApproveClassroomRequest
                    classroomId={classroomId}
                    role="student"
                    onApprovalChange={handleApprovalChange}
                  />
                </Card>
                <Card title="Teacher Requests">
                  <ApproveClassroomRequest
                    classroomId={classroomId}
                    role="teacher"
                    onApprovalChange={handleApprovalChange}
                  />
                </Card>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="layout-bg mh-100vh p-5">
      {contextHolder}
      {!loading && classroomInfo ? (
        <>
          <div className="flex flex-between-center mb-5" style={{ flexWrap: "wrap", gap: "var(--spacing-md)" }}>
            <div>
              <Button
                type="link"
                onClick={() => navigate("/classrooms")}
                style={{ padding: 0, marginBottom: "var(--spacing-xs)" }}
                aria-label="Back to classrooms"
              >
                ← Back to Classrooms
              </Button>
              <h2 style={{ margin: 0 }}>{classroomInfo.name}</h2>
              {classroomInfo.description && (
                <p style={{ margin: "var(--spacing-xs) 0 0 0", color: "var(--color-text-secondary)" }}>
                  {classroomInfo.description}
                </p>
              )}
              {creatorInfo && (
                <div style={{ marginTop: "var(--spacing-sm)", display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Created by:</span>
                  <Link to={`/profile/${creatorInfo.username || creatorInfo.fullname || classroomInfo.create_user}`}>
                    <Space>
                      <Avatar
                        size="small"
                        src={creatorInfo.sm_img}
                        icon={<UserOutlined />}
                        style={{ marginRight: "var(--spacing-xs)" }}
                      />
                      <span style={{ fontWeight: 500, color: "var(--color-primary)" }}>
                        {creatorInfo.fullname || creatorInfo.username || classroomInfo.create_user}
                      </span>
                    </Space>
                  </Link>
                </div>
              )}
            </div>
            {isStaff && menuProps && (
              <Dropdown menu={menuProps} trigger={["click"]}>
                <Button>
                  <Space>
                    <SettingOutlined aria-hidden="true" />
                    Manage
                    <DownOutlined aria-hidden="true" />
                  </Space>
                </Button>
              </Dropdown>
            )}
            {!isStaff && (
              <Space>
                <RequestClassroomAccess
                  classroomId={classroomId}
                  role="student"
                  onSuccess={loadClassroomData}
                />
                <RequestClassroomAccess
                  classroomId={classroomId}
                  role="teacher"
                  onSuccess={loadClassroomData}
                />
              </Space>
            )}
          </div>

          <Divider />

          <Tabs items={tabItems} defaultActiveKey="students" />
        </>
      ) : loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Empty description="Classroom not found" />
      )}
    </div>
  );
};

export default ClassroomDetail;

