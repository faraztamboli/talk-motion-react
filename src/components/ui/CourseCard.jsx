import React, { useState, useEffect } from "react";
import { Card, Button, Dropdown, Avatar, Tag, Tooltip, Space } from "antd";
import { 
  MdOutlineArrowRightAlt, 
  MdMoreVert,
  MdFolder,
  MdPublic,
  MdLock
} from "react-icons/md";
import { Link } from "react-router-dom";
import { UserOutlined, BookOutlined, FileTextOutlined, EditOutlined } from "@ant-design/icons";
import EditCourseModal from "./EditCourseModal";
import plurkImg from "../../media/images/plurk.png";
import useProfile from "../../hooks/useProfile";

export const CourseCard = (props) => {
  const { course, onEdit, onDelete, showActions = true } = props;
  const [isHovered, setIsHovered] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const { getUserInfo } = useProfile();

  useEffect(() => {
    const creatorUsername = course?.create_user || course?.created_by || course?.creator;
    if (creatorUsername) {
      getUserInfo(creatorUsername)
        .then((res) => {
          setCreatorInfo(res);
        })
        .catch((err) => {
          console.log("Error loading creator info:", err);
          // Set basic info from course data
          setCreatorInfo({ username: creatorUsername });
        });
    }
  }, [course?.create_user, course?.created_by, course?.creator]);

  const items = [];
  
  if (onDelete) {
    items.push({
      key: "delete",
      label: "Delete Course",
      danger: true,
    });
  }

  const handleMenuClick = ({ key }) => {
    if (key === "delete" && onDelete) {
      onDelete(course);
    }
  };

  const menuProps = items.length > 0 ? {
    items,
    onClick: handleMenuClick,
  } : null;

  return (
    <Card
      bordered={false}
      className="course-card"
      style={{ 
        minWidth: 200, 
        height: "100%",
        transition: "all var(--transition-base)",
        cursor: "pointer",
        boxShadow: isHovered 
          ? "0 4px 12px rgba(0, 0, 0, 0.15)" 
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      hoverable
    >
      <div 
        className="flex" 
        style={{ 
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--spacing-md)"
        }}
      >
        <div
          className="course-logo-div"
          style={{
            backgroundColor: "var(--color-neutral-200)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-md)",
            transition: "all var(--transition-base)",
            width: 64,
            height: 64,
          }}
        >
          {course.image ? (
            <img
              src={course.image}
              alt={`${course.name} logo`}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
            />
          ) : (
            <MdFolder size={32} style={{ color: "var(--color-primary)" }} aria-hidden="true" />
          )}
        </div>

        {showActions && (
          <Space>
            <EditCourseModal 
              course={course} 
              onSuccess={onEdit}
            />
            {menuProps && (
              <Dropdown menu={menuProps} placement="bottomRight" trigger={["click"]}>
                <Button
                  className="flex"
                  style={{
                    border: "none",
                    boxShadow: "none",
                    transition: "all var(--transition-base)",
                    padding: "var(--spacing-xs)",
                  }}
                  size="large"
                  aria-label="Open course options menu"
                  aria-haspopup="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MdMoreVert size={20} aria-hidden="true" />
                </Button>
              </Dropdown>
            )}
          </Space>
        )}
      </div>

      <div className="course-content" style={{ marginTop: "var(--spacing-md)" }}>
        <div style={{ marginBottom: "var(--spacing-sm)" }}>
          <Space>
            <h2 
              className="course-card-heading"
              style={{ 
                margin: 0,
                fontSize: "var(--font-size-lg)",
                fontWeight: 600,
                color: "var(--color-text-primary)"
              }}
            >
              {course.name}
            </h2>
            {course.is_public !== undefined && (
              <Tag 
                icon={course.is_public ? <MdPublic aria-hidden="true" /> : <MdLock aria-hidden="true" />}
                color={course.is_public ? "success" : "default"}
              >
                {course.is_public ? "Public" : "Private"}
              </Tag>
            )}
          </Space>
        </div>
        
        {course.description && (
          <p 
            className="course-card-description"
            style={{ 
              margin: 0,
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-base)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.description}
          </p>
        )}

        <div 
          className="course-stats"
          style={{ 
            marginTop: "var(--spacing-md)",
            display: "flex",
            gap: "var(--spacing-md)",
            alignItems: "center",
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-sm)"
          }}
        >
          {course.children && course.children.length > 0 && (
            <Space>
              <BookOutlined aria-hidden="true" />
              <span>{course.children.length} Topics</span>
            </Space>
          )}
          {course.contents && course.contents.length > 0 && (
            <Space>
              <FileTextOutlined aria-hidden="true" />
              <span>{course.contents.length} Items</span>
            </Space>
          )}
        </div>

        {creatorInfo && (
          <div 
            className="course-creator"
            style={{ 
              marginTop: "var(--spacing-md)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)"
            }}
          >
            <Avatar.Group>
              <Tooltip 
                title={creatorInfo.fullname || creatorInfo.username || course?.create_user || course?.created_by || course?.creator} 
                placement="top"
              >
                <Avatar 
                  src={creatorInfo.sm_img ? creatorInfo.sm_img : null}
                  icon={<UserOutlined />}
                />
              </Tooltip>
            </Avatar.Group>
            <span>
              Created by {creatorInfo.fullname || creatorInfo.username || course?.create_user || course?.created_by || course?.creator}
            </span>
          </div>
        )}
      </div>

      <div
        className="course-actions flex align-items-center justify-content-end"
        style={{ marginTop: "var(--spacing-lg)" }}
      >
        <Link 
          to={`/video-subtitles/folder-manager/${course.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="primary"
            className="course-card-btn flex flex-center-center"
            aria-label={`Open course ${course.name}`}
            style={{
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
            }}
          >
            Open Course <MdOutlineArrowRightAlt size={20} aria-hidden="true" style={{ marginLeft: "var(--spacing-xs)" }} />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default CourseCard;

