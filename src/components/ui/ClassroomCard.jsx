import React, { useState, useEffect } from "react";
import { Card, Button, Dropdown, Avatar, Tooltip, Space, Badge } from "antd";
import { MdOutlineArrowRightAlt, MdMoreVert } from "react-icons/md";
import { Link } from "react-router-dom";
import { UserOutlined, UserAddOutlined } from "@ant-design/icons";
import UpdateClassroom from "../../components/ui/UpdateClassroom";
import RequestClassroomAccess from "../../components/ui/RequestClassroomAccess";
import RequestStatusBadge from "../../components/ui/RequestStatusBadge";
import plurkImg from "../../media/images/plurk.png";
import useProfile from "../../hooks/useProfile";
import useClassrooms from "../../hooks/useClassrooms";

const isAuthorizationError = (errorMsg) => {
  return errorMsg.includes("neither classroom teacher or creator") || 
         errorMsg.includes("not student, teacher or creator");
};

export const ClassroomCard = (props) => {
  const [userImg, setUserImg] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { getUserInfo } = useProfile();
  const { getClassStudents, getClassTeachers } = useClassrooms();
  const { classroom, updateClassroom, setLoading, showRequestButton = false, currentUserId } = props;

  useEffect(() => {
    getUserInfo(classroom.create_user)
      .then((res) => {
        console.log(res);
        setUserImg(res.sm_img);
      })
      .catch((err) => console.log(err));

    // Check if user is a member or has pending request
    if (showRequestButton && currentUserId && classroom.id) {
      checkUserStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [classroom.id, showRequestButton, currentUserId]);

  const checkUserStatus = async () => {
    setCheckingStatus(true);
    try {
      let students = [];
      let teachers = [];

      try {
        students = await getClassStudents(classroom.id, true); // approved students
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        // Authorization errors are expected for users without access - silently handle
        // (no need to show message here as it's just checking status)
        if (!isAuthorizationError(errorMsg)) {
          console.error("Error loading students:", err);
        }
      }

      try {
        teachers = await getClassTeachers(classroom.id, true); // approved teachers
      } catch (err) {
        const errorMsg = err?.message || err?.toString() || "";
        // Authorization errors are expected for users without access - silently handle
        // (no need to show message here as it's just checking status)
        if (!isAuthorizationError(errorMsg)) {
          console.error("Error loading teachers:", err);
        }
      }

      // Check if user is already a member
      const isStudent = students?.some((s) => s.user_id === currentUserId || s.id === currentUserId);
      const isTeacher = teachers?.some((t) => t.user_id === currentUserId || t.id === currentUserId);

      if (isStudent || isTeacher) {
        setIsMember(true);
        setRequestStatus(null);
      } else {
        // Check for pending requests
        let pendingStudents = [];
        let pendingTeachers = [];

        try {
          pendingStudents = await getClassStudents(classroom.id, false); // pending students
        } catch (err) {
          const errorMsg = err?.message || err?.toString() || "";
          // Authorization errors are expected for non-staff users - silently handle
          // (no need to show message here as it's just checking status)
          if (!isAuthorizationError(errorMsg)) {
            console.error("Error loading pending students:", err);
          }
        }

        try {
          pendingTeachers = await getClassTeachers(classroom.id, false); // pending teachers
        } catch (err) {
          const errorMsg = err?.message || err?.toString() || "";
          // Authorization errors are expected for non-staff users - silently handle
          // (no need to show message here as it's just checking status)
          if (!isAuthorizationError(errorMsg)) {
            console.error("Error loading pending teachers:", err);
          }
        }

        const hasPendingStudentRequest = pendingStudents?.some(
          (s) => !s.is_approved && (s.user_id === currentUserId || s.id === currentUserId)
        );
        const hasPendingTeacherRequest = pendingTeachers?.some(
          (t) => !t.is_approved && (t.user_id === currentUserId || t.id === currentUserId)
        );

        if (hasPendingStudentRequest || hasPendingTeacherRequest) {
          setRequestStatus("pending");
        } else {
          setRequestStatus("none");
        }
      }
    } catch (err) {
      console.error("Error checking user status:", err);
      setRequestStatus("none");
    } finally {
      setCheckingStatus(false);
    }
  };

  const items = [
    {
      key: "1",
      label: (
        <UpdateClassroom
          updateClassroom={updateClassroom}
          setLoading={setLoading}
          classroom={classroom}
        />
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      className="models-card"
      style={{ minWidth: 200, height: "100%" }}
    >
      <div 
        className="flex" 
        style={{ 
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div
          className="logo_div"
          style={{
            backgroundColor: "var(--color-neutral-200)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--spacing-sm)",
            borderRadius: "var(--radius-md)",
            transition: "all var(--transition-base)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-neutral-300)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-neutral-200)";
          }}
        >
          <img
            src={classroom.image ? classroom.image : plurkImg}
            alt="classroom logo"
            width={40}
          />
        </div>

        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
          <Button
            className="flex"
            style={{
              border: "none",
              boxShadow: "none",
              transition: "all var(--transition-base)"
            }}
            size="large"
            aria-label="Open classroom options menu"
            aria-haspopup="true"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-neutral-100)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <MdMoreVert size={20} aria-hidden="true" />
          </Button>
        </Dropdown>
      </div>

      <div className="card_content" style={{ marginTop: "1.5rem" }}>
        <h2 className="models-card-heading">{classroom.name}</h2>
        <h3 className="models-card-description">{classroom.description}</h3>
      </div>

      <div className="trainer_div" style={{ marginTop: "1rem" }}>
        <Avatar.Group>
          <Tooltip title={classroom.create_user} placement="top">
            <Avatar src={userImg} icon={<UserOutlined />} />
          </Tooltip>
        </Avatar.Group>
      </div>

      <div
        className="card_btns flex align-items-center justify-content-between"
        style={{ marginTop: "1rem", gap: "var(--spacing-sm)" }}
      >
        {showRequestButton && !isMember && !checkingStatus && (
          <div style={{ flex: 1 }}>
            {requestStatus === "pending" ? (
              <RequestStatusBadge status="pending" showText={true} />
            ) : requestStatus === "none" ? (
              <RequestClassroomAccess
                classroomId={classroom.id}
                role="student"
                buttonProps={{
                  size: "small",
                  icon: <UserAddOutlined />,
                  style: { width: "100%" },
                }}
              />
            ) : null}
          </div>
        )}
        <Link to={`/classroom/${classroom.id}`} style={{ flex: showRequestButton && !isMember ? 1 : "none" }}>
          <Button
            type="primary"
            className="models-card-btn flex flex-center-center"
            aria-label={`Enter classroom ${classroom.name}`}
            style={{
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              width: showRequestButton && !isMember ? "100%" : "auto",
            }}
          >
            Enter <MdOutlineArrowRightAlt size={20} aria-hidden="true" style={{ marginLeft: "var(--spacing-xs)" }} />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
