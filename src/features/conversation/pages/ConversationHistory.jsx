import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, List, Popconfirm, Skeleton, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined, DownloadOutlined, MessageOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { deleteConversation, downloadTranscript, listConversations } from "../api";
import "../conversation.css";

function minutesBetween(a, b) {
  if (!a || !b) return null;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
}

/**
 * /conversation/history: the transcripts kept for this account. Each one can be saved as a
 * text file or deleted for good (owner only).
 */
export default function ConversationHistory() {
  const { t } = useTranslation();
  const meId = useSelector((state) => state.apiAuth?.user?.id);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    listConversations()
      .then((rows) => setItems(rows.filter((c) => c.settings?.kind !== "lesson")))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const save = async (c) => {
    try {
      await downloadTranscript(c.id, { startedAt: c.started_at });
    } catch (err) {
      message.error(err.message);
    }
  };

  const remove = async (c) => {
    try {
      await deleteConversation(c.id);
      setItems((rows) => rows.filter((r) => r.id !== c.id));
      message.success(t("conversation.deleted", "Conversation deleted"));
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div className="conv-root" style={{ height: "auto" }}>
      <Card
        title={<><MessageOutlined /> {t("conversation.history", "My conversations")}</>}
        extra={<Link to="/conversation">{t("conversation.startNew", "Start a conversation")}</Link>}
      >
        <Typography.Paragraph type="secondary">
          {t(
            "conversation.historyHelp",
            "Your transcripts are kept here for you. Save one as a text file, or delete it. A deleted conversation leaves our nightly backups within 35 days."
          )}
        </Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} />}
        {!items && !error && <Skeleton active />}
        {items && items.length === 0 && (
          <Empty description={t("conversation.historyEmpty", "No conversations yet.")} />
        )}
        {items && items.length > 0 && (
          <List
            dataSource={items}
            renderItem={(c) => {
              const others = (c.participants || [])
                .filter((p) => p.user_id !== meId)
                .map((p) => p.display_name);
              const label = others.length ? others.join(", ") : c.settings?.partner_label || null;
              const minutes = minutesBetween(c.started_at, c.ended_at);
              const owner = c.owner_id === meId;
              return (
                <List.Item
                  actions={[
                    c.status === "open" && (
                      <Link key="open" to={`/conversation/${c.id}`}>
                        {t("conversation.continue", "Continue")}
                      </Link>
                    ),
                    <Button key="save" icon={<DownloadOutlined />} onClick={() => save(c)}>
                      {t("conversation.download", "Save transcript")}
                    </Button>,
                    owner && (
                      <Popconfirm
                        key="delete"
                        title={t("conversation.deleteConfirm", "Delete this conversation and everything said in it?")}
                        okText={t("conversation.delete", "Delete")}
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(c)}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          {t("conversation.delete", "Delete")}
                        </Button>
                      </Popconfirm>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={new Date(c.started_at).toLocaleString()}
                    description={
                      <Space wrap>
                        {label && <span>{t("conversation.with", "With")} {label}</span>}
                        {minutes && <span>{t("conversation.minutes", { defaultValue: "{{n}} min", n: minutes })}</span>}
                        {c.status === "open" && <Tag color="green">{t("conversation.openTag", "Open")}</Tag>}
                        {c.mode === "two_device" && <Tag>{t("conversation.twoDevicesTag", "Two phones")}</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
