import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Input, Modal, Radio, Typography } from "antd";
import { useTranslation } from "react-i18next";

/**
 * Create or edit a model. `initial` (edit) is a normalized model. onSubmit({ title, description,
 * isPublic }) returns a promise; the modal stays open with the error if it rejects.
 */
export default function ModelFormModal({ open, initial, onCancel, onSubmit, submitting, error }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      title: initial?.title || "",
      description: initial?.description || "",
      isPublic: initial?.isPublic ?? false,
    });
  }, [open, initial, form]);

  const submit = async () => {
    const values = await form.validateFields();
    await onSubmit({ title: values.title.trim(), description: (values.description || "").trim(), isPublic: values.isPublic });
  };

  return (
    <Modal
      open={open}
      title={editing ? t("models.form.editTitle", "Edit model") : t("models.form.createTitle", "Create a model")}
      okText={editing ? t("models.form.save", "Save") : t("models.form.create", "Create model")}
      onOk={() => submit().catch(() => {})}
      onCancel={onCancel}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="title"
          label={t("models.form.name", "Name")}
          rules={[
            { required: true, whitespace: true, message: t("models.form.nameRequired", "Give the model a name") },
            { max: 120, message: t("models.form.nameLong", "Keep the name under 120 characters") },
          ]}
        >
          <Input placeholder={t("models.form.namePlaceholder", "For example: Everyday greetings")} autoFocus />
        </Form.Item>
        <Form.Item name="description" label={t("models.form.description", "Description")} rules={[{ max: 1000 }]}>
          <Input.TextArea rows={3} placeholder={t("models.form.descriptionPlaceholder", "What signs will it recognise?")} />
        </Form.Item>
        <Form.Item name="isPublic" label={t("models.form.visibility", "Who can find it")}>
          <Radio.Group>
            <Radio value={false}>{t("models.form.private", "Only me and my trainers")}</Radio>
            <Radio value={true}>{t("models.form.public", "Everyone, in the store")}</Radio>
          </Radio.Group>
        </Form.Item>
        {error && (
          <Typography.Text type="danger" role="alert">
            {error}
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}

ModelFormModal.propTypes = {
  open: PropTypes.bool,
  initial: PropTypes.object,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
};
