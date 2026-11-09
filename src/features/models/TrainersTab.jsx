import React, { useState } from "react";
import { Alert, Avatar, Button, Card, Input, List, Modal, Space, Tag, Typography, message } from "antd";
import { UserOutlined, UserAddOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useModelContext } from "./ModelPage";
import { useAddTrainerMutation, useRemoveTrainerMutation } from "./modelsApi";

/** People who can record samples for this model and train it. The owner manages the list. */
export default function TrainersTab() {
  const { t } = useTranslation();
  const { model, modelId } = useModelContext();
  const canManage = model.permissions.manage;
  const [username, setUsername] = useState("");
  const [addError, setAddError] = useState(null);
  const [addTrainer, addState] = useAddTrainerMutation();
  const [removeTrainer] = useRemoveTrainerMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();

  const add = async () => {
    const name = username.trim();
    if (!name) return;
    setAddError(null);
    try {
      await addTrainer({ modelId, username: name }).unwrap();
      setUsername("");
      messageApi.success(t("models.trainers.added", "{{name}} can now train this model.", { name }));
    } catch (err) {
      setAddError(rpcErrorMessage(err));
    }
  };

  const remove = (tr) =>
    modal.confirm({
      title: t("models.trainers.removeTitle", "Remove {{name}}?", { name: tr.fullname || tr.username }),
      content: t("models.trainers.removeBody", "They can no longer record samples or train this model. Samples they recorded stay."),
      okText: t("models.trainers.removeOk", "Remove"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeTrainer({ modelId, username: tr.username }).unwrap();
        } catch (err) {
          messageApi.error(rpcErrorMessage(err));
        }
      },
    });

  return (
    <div className="tm-tab">
      {contextHolder}
      {modalHolder}
      <Card title={t("models.trainers.title", "Trainers")}>
        <Typography.Paragraph type="secondary">
          {t("models.trainers.help", "Trainers can add words, record samples and train the model. Only the owner can rename, delete or sell it.")}
        </Typography.Paragraph>
        {canManage && (
          <>
            <Space.Compact style={{ width: "100%", maxWidth: 420 }}>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onPressEnter={add}
                placeholder={t("models.trainers.placeholder", "TalkMotion username")}
                aria-label={t("models.trainers.placeholder", "TalkMotion username")}
                prefix={<UserOutlined />}
              />
              <Button type="primary" icon={<UserAddOutlined />} onClick={add} loading={addState.isLoading} disabled={!username.trim()}>
                {t("models.trainers.add", "Add trainer")}
              </Button>
            </Space.Compact>
            {addError && <Alert type="error" showIcon message={addError} className="tm-block-sm" />}
          </>
        )}
        <List
          className="tm-block"
          dataSource={model.trainers}
          locale={{ emptyText: t("models.trainers.none", "No trainers yet.") }}
          renderItem={(tr) => {
            const isOwner = tr.username === model.owner;
            return (
              <List.Item
                actions={
                  canManage && !isOwner
                    ? [
                        <Button key="r" size="small" danger type="link" onClick={() => remove(tr)}>
                          {t("models.trainers.remove", "Remove")}
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={<Avatar src={tr.sm_img || undefined} icon={!tr.sm_img && <UserOutlined />} />}
                  title={
                    <Space>
                      {tr.fullname || [tr.first, tr.last].filter(Boolean).join(" ") || tr.username}
                      {isOwner && <Tag>{t("models.role.owner", "Owner")}</Tag>}
                    </Space>
                  }
                  description={`@${tr.username}`}
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
