import React, { useState, useEffect } from "react";
import { Badge, Dropdown, List, Button, Empty, Space, Tag, Typography } from "antd";
import { BellOutlined, CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import useMessageApi from "../../hooks/useMessageApi";
import { formatDistanceToNow } from "../../utils/dateUtils";

const { Text } = Typography;

export const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } =
    useNotifications();
  const { contextHolder, showMessage } = useMessageApi();

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await getUserNotifications(false, 10);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showMessage("success", "All notifications marked as read");
    } catch (err) {
      console.error("Error marking all as read:", err);
      showMessage("error", "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      showMessage("success", "Notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
      showMessage("error", "Failed to delete notification");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      // Navigation will be handled by Link component
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  const notificationContent = (
    <div style={{ width: "320px", maxHeight: "400px" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <div style={{ maxHeight: "350px", overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <Text type="secondary">Loading...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "20px" }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: "12px 16px",
                  backgroundColor: notification.read ? "transparent" : "#f6ffed",
                  cursor: notification.actionUrl ? "pointer" : "default",
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong={!notification.read}>{notification.title}</Text>
                      {!notification.read && <Tag color="green" size="small">New</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: "4px" }}>{notification.message}</div>
                      <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  }
                />
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(notification.id, e)}
                  danger
                />
              </List.Item>
            )}
          />
        )}
      </div>
      {notifications.length > 0 && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
          <Link to="/notifications" style={{ fontSize: "12px" }}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {contextHolder}
      <Dropdown
        dropdownRender={() => notificationContent}
        trigger={["click"]}
        placement="bottomRight"
        dropdownStyle={{ padding: 0 }}
      >
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: "20px" }} />}
            style={{ fontSize: "20px" }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          />
        </Badge>
      </Dropdown>
    </>
  );
};

export default NotificationsPanel;

