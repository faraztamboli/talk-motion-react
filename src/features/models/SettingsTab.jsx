import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Input, Modal, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useModelContext } from "./ModelPage";
import { useCloneModelMutation, useDeleteModelMutation, useUpdateModelMutation } from "./modelsApi";
import ModelFormModal from "./ModelFormModal";

export default function SettingsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { model, modelId } = useModelContext();
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updateModel, updateState] = useUpdateModelMutation();
  const [cloneModel, cloneState] = useCloneModelMutation();
  const [deleteModel, deleteState] = useDeleteModelMutation();
  const [messageApi, contextHolder] = message.useMessage();

  if (!model.permissions.manage) {
    return <Alert type="info" showIcon message={t("models.settings.noAccess", "Only the model's owner can change its settings.")} />;
  }

  const save = async (values) => {
    setEditError(null);
    try {
      await updateModel({ id: modelId, ...values }).unwrap();
      setEditing(false);
      messageApi.success(t("models.settings.saved", "Saved."));
    } catch (err) {
      setEditError(rpcErrorMessage(err));
      throw err;
    }
  };

  const copy = async () => {
    try {
      const res = await cloneModel(modelId).unwrap();
      messageApi.success(t("models.settings.copied", "Copy created."));
      if (res?.model_id) navigate(`/models/${res.model_id}`);
    } catch (err) {
      messageApi.error(rpcErrorMessage(err, t("models.settings.copyFailed", "We couldn't copy the model.")));
    }
  };

  const remove = async () => {
    try {
      await deleteModel(modelId).unwrap();
      messageApi.success(t("models.settings.deleted", "“{{title}}” was deleted.", { title: model.title }));
      navigate("/models", { replace: true });
    } catch (err) {
      messageApi.error(rpcErrorMessage(err, t("models.settings.deleteFailed", "We couldn't delete the model.")));
    }
  };

  return (
    <div className="tm-tab">
      {contextHolder}
      <Card title={t("models.settings.details", "Details")} className="tm-block-sm">
        <Space direction="vertical">
          <Typography.Text>
            <strong>{t("models.form.name", "Name")}:</strong> {model.title}
          </Typography.Text>
          <Typography.Text>
            <strong>{t("models.form.description", "Description")}:</strong> {model.description || "–"}
          </Typography.Text>
          <Typography.Text>
            <strong>{t("models.form.visibility", "Who can find it")}:</strong>{" "}
            {model.isPublic ? t("models.form.public", "Everyone, in the store") : t("models.form.private", "Only me and my trainers")}
          </Typography.Text>
          <Button onClick={() => setEditing(true)}>{t("models.settings.edit", "Edit details")}</Button>
        </Space>
      </Card>

      <Card title={t("models.settings.copyTitle", "Make a copy")} className="tm-block-sm">
        <Typography.Paragraph type="secondary">
          {t("models.settings.copyHelp", "A private copy with the same words, samples and trained model. Useful before big changes.")}
        </Typography.Paragraph>
        <Button onClick={copy} loading={cloneState.isLoading}>
          {t("models.settings.copy", "Copy this model")}
        </Button>
      </Card>

      <Card title={t("models.settings.dangerTitle", "Delete this model")} className="tm-danger-card">
        <Typography.Paragraph type="secondary">
          {t("models.settings.dangerHelp", "Deletes the model, its words, samples and training history for everyone, including trainers and buyers. This can't be undone.")}
        </Typography.Paragraph>
        <Button danger onClick={() => setDeleting(true)}>
          {t("models.settings.delete", "Delete model")}
        </Button>
      </Card>

      <ModelFormModal
        open={editing}
        initial={model}
        onCancel={() => setEditing(false)}
        onSubmit={save}
        submitting={updateState.isLoading}
        error={editError}
      />

      <Modal
        open={deleting}
        title={t("models.settings.confirmTitle", "Delete “{{title}}”?", { title: model.title })}
        okText={t("models.settings.delete", "Delete model")}
        okButtonProps={{ danger: true, disabled: confirmText.trim() !== model.title.trim() }}
        confirmLoading={deleteState.isLoading}
        onOk={remove}
        onCancel={() => {
          setDeleting(false);
          setConfirmText("");
        }}
        destroyOnClose
      >
        <Typography.Paragraph>
          {t("models.settings.confirmBody", "Type the model's name to confirm:")} <strong>{model.title}</strong>
        </Typography.Paragraph>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label={t("models.settings.confirmLabel", "Model name")} autoFocus />
      </Modal>
    </div>
  );
}
