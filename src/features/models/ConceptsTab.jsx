import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { MoreOutlined, PlayCircleOutlined, PlusOutlined, VideoCameraAddOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useModelContext } from "./ModelPage";
import {
  useCreateConceptMutation,
  useDeleteConceptMutation,
  useListConceptsQuery,
  useRenameConceptMutation,
  useUpdateConceptMutation,
} from "./modelsApi";
import ConceptVideoModal from "./ConceptVideoModal";

/** "hello, thank you\nplease" -> ["hello", "thank you", "please"] (trimmed, unique, non-empty). */
export function splitConceptInput(text) {
  const seen = new Set();
  return String(text || "")
    .split(/[,\n;]+/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => {
      const key = s.toLowerCase();
      if (!s || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const conceptPath = (modelId, concept) => `/models/${modelId}/concepts/${encodeURIComponent(concept)}`;

export default function ConceptsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { model, modelId } = useModelContext();
  const canTrain = model.permissions.train;
  const canManage = model.permissions.manage;
  const { data: concepts = [], error, isLoading, isFetching, refetch } = useListConceptsQuery(modelId);
  const [createConcept, createState] = useCreateConceptMutation();
  const [updateConcept] = useUpdateConceptMutation();
  const [renameConcept, renameState] = useRenameConceptMutation();
  const [deleteConcept] = useDeleteConceptMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();
  const [adding, setAdding] = useState("");
  const [addError, setAddError] = useState(null);
  const [filter, setFilter] = useState("");
  const [videoFor, setVideoFor] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameForm] = Form.useForm();

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? concepts.filter((c) => c.concept.includes(q) || c.label.toLowerCase().includes(q)) : concepts;
  }, [concepts, filter]);

  const add = async () => {
    setAddError(null);
    const items = splitConceptInput(adding);
    if (!items.length) return;
    const failed = [];
    for (const text of items) {
      try {
        await createConcept({ modelId, text }).unwrap();
      } catch (err) {
        failed.push(`${text}: ${rpcErrorMessage(err)}`);
      }
    }
    if (failed.length) setAddError(failed.join(" · "));
    else {
      setAdding("");
      messageApi.success(
        items.length === 1
          ? t("models.concepts.addedOne", "Added “{{text}}”.", { text: items[0] })
          : t("models.concepts.addedMany", "Added {{count}} words and phrases.", { count: items.length })
      );
    }
  };

  const changeTarget = (c) => {
    let value = c.target;
    modal.confirm({
      title: t("models.concepts.targetTitle", "Sample target for “{{label}}”", { label: c.label }),
      content: (
        <Space direction="vertical">
          <Typography.Text type="secondary">
            {t("models.concepts.targetHelp", "More samples make recognition more reliable. 15 to 30 is a good range.")}
          </Typography.Text>
          <InputNumber min={1} max={500} defaultValue={c.target} onChange={(v) => (value = v)} aria-label="Target" />
        </Space>
      ),
      okText: t("models.form.save", "Save"),
      onOk: () => updateConcept({ modelId, concept: c.concept, target: value }).unwrap().catch((err) => {
        messageApi.error(rpcErrorMessage(err));
      }),
    });
  };

  const confirmDelete = (c) =>
    modal.confirm({
      title: t("models.concepts.deleteTitle", "Delete “{{label}}”?", { label: c.label }),
      content:
        c.sampleCount > 0
          ? t("models.concepts.deleteBody", "Its {{count}} samples and its reference video link are deleted too. Retrain the model afterwards.", {
              count: c.sampleCount,
            })
          : t("models.concepts.deleteEmpty", "It has no samples yet."),
      okText: t("models.concepts.deleteOk", "Delete"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteConcept({ modelId, concept: c.concept }).unwrap();
          messageApi.success(t("models.concepts.deleted", "Deleted “{{label}}” ({{count}} samples).", { label: c.label, count: res.deleted_samples }));
        } catch (err) {
          messageApi.error(rpcErrorMessage(err));
        }
      },
    });

  const doRename = async () => {
    const { newText } = await renameForm.validateFields();
    const target = concepts.find((c) => c.concept === newText.trim().toLowerCase().replace(/\s+/g, " "));
    const go = async () => {
      try {
        const res = await renameConcept({ modelId, concept: renaming.concept, newText }).unwrap();
        messageApi.success(
          res.merged
            ? t("models.concepts.merged", "Merged into “{{c}}” ({{n}} samples moved).", { c: res.concept, n: res.moved_samples })
            : t("models.concepts.renamed", "Renamed to “{{c}}”.", { c: res.concept })
        );
        setRenaming(null);
      } catch (err) {
        messageApi.error(rpcErrorMessage(err));
      }
    };
    if (target && target.concept !== renaming.concept) {
      modal.confirm({
        title: t("models.concepts.mergeTitle", "Merge into “{{label}}”?", { label: target.label }),
        content: t("models.concepts.mergeBody", "“{{a}}” already exists. Its samples and these will be combined.", { a: target.label }),
        okText: t("models.concepts.mergeOk", "Merge"),
        onOk: go,
      });
    } else await go();
  };

  const columns = [
    {
      title: t("models.concepts.colConcept", "Word or phrase"),
      dataIndex: "label",
      sorter: (a, b) => a.concept.localeCompare(b.concept),
      defaultSortOrder: "ascend",
      render: (label, c) => (
        <Space size={6} wrap>
          <Link to={conceptPath(modelId, c.concept)} className="tm-concept-name">
            {label}
          </Link>
          {c.kind === "phrase" && <Tag bordered={false}>{t("models.concepts.phrase", "phrase")}</Tag>}
        </Space>
      ),
    },
    {
      title: t("models.concepts.colSamples", "Samples"),
      key: "samples",
      sorter: (a, b) => a.sampleCount - b.sampleCount,
      render: (_, c) => {
        const pct = Math.min(100, Math.round((c.sampleCount / Math.max(1, c.target)) * 100));
        return (
          <div className="tm-concept-progress">
            <Progress
              percent={pct}
              size="small"
              showInfo={false}
              status={pct >= 100 ? "success" : "normal"}
              aria-label={t("models.concepts.progressLabel", "{{n}} of {{target}} samples", { n: c.sampleCount, target: c.target })}
            />
            <Typography.Text type="secondary" className="tm-concept-count">
              {c.sampleCount} / {c.target}
              {c.processingCount > 0 && ` · ${t("models.concepts.processing", "{{n}} processing", { n: c.processingCount })}`}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: t("models.concepts.colVideo", "Reference video"),
      key: "video",
      responsive: ["md"],
      render: (_, c) =>
        c.videoUrl ? (
          <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => setVideoFor(c)}>
            {t("models.concepts.hasVideo", "View")}
          </Button>
        ) : canTrain ? (
          <Button size="small" type="link" icon={<VideoCameraAddOutlined />} onClick={() => setVideoFor(c)}>
            {t("models.concepts.addVideo", "Add")}
          </Button>
        ) : (
          <Typography.Text type="secondary">–</Typography.Text>
        ),
    },
    {
      title: <span className="tm-visually-hidden">{t("models.concepts.colActions", "Actions")}</span>,
      key: "actions",
      align: "right",
      render: (_, c) => (
        <Space>
          {canTrain && (
            <Button size="small" onClick={() => navigate(`/models/${modelId}/collect?concept=${encodeURIComponent(c.concept)}`)}>
              {t("models.concepts.record", "Record")}
            </Button>
          )}
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "samples", label: t("models.concepts.viewSamples", "View samples") },
                canTrain && { key: "video", label: c.videoUrl ? t("models.concepts.changeVideo", "Change video") : t("models.concepts.addVideoLong", "Add reference video") },
                canTrain && { key: "target", label: t("models.concepts.changeTarget", "Change sample target") },
                canManage && { key: "rename", label: t("models.concepts.rename", "Rename or merge") },
                canManage && { type: "divider" },
                canManage && { key: "delete", danger: true, label: t("models.concepts.delete", "Delete") },
              ].filter(Boolean),
              onClick: ({ key }) => {
                if (key === "samples") navigate(conceptPath(modelId, c.concept));
                if (key === "video") setVideoFor(c);
                if (key === "target") changeTarget(c);
                if (key === "rename") {
                  setRenaming(c);
                  renameForm.setFieldsValue({ newText: c.label });
                }
                if (key === "delete") confirmDelete(c);
              },
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t("models.concepts.more", "More actions for {{label}}", { label: c.label })} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="tm-tab">
      {contextHolder}
      {modalHolder}
      {canTrain && (
        <Card className="tm-block">
          <Typography.Text strong>{t("models.concepts.addTitle", "Add words or phrases")}</Typography.Text>
          <Typography.Paragraph type="secondary" className="tm-help">
            {t("models.concepts.addHelp", "Separate several with commas. A phrase like “thank you” can be one sign.")}
          </Typography.Paragraph>
          <Space.Compact style={{ width: "100%", maxWidth: 560 }}>
            <Input
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onPressEnter={add}
              placeholder={t("models.concepts.addPlaceholder", "hello, thank you, please")}
              aria-label={t("models.concepts.addTitle", "Add words or phrases")}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={add} loading={createState.isLoading} disabled={!adding.trim()}>
              {t("models.concepts.add", "Add")}
            </Button>
          </Space.Compact>
          {addError && <Alert className="tm-block" type="error" showIcon message={addError} />}
        </Card>
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          className="tm-block"
          message={rpcErrorMessage(error, t("models.concepts.loadFailed", "We couldn't load the words and phrases."))}
          action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>}
        />
      )}

      <Card className="tm-block">
        {concepts.length > 8 && (
          <Input.Search
            allowClear
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("models.concepts.filter", "Find a word or phrase")}
            className="tm-block-sm"
            style={{ maxWidth: 320 }}
          />
        )}
        <Table
          rowKey="concept"
          columns={columns}
          dataSource={shown}
          loading={isLoading || (isFetching && !concepts.length)}
          pagination={shown.length > 25 ? { pageSize: 25, showSizeChanger: false } : false}
          size="middle"
          scroll={{ x: 560 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  canTrain
                    ? t("models.concepts.empty", "No words or phrases yet. Add the first one above.")
                    : t("models.concepts.emptyViewer", "This model has no words or phrases yet.")
                }
              />
            ),
          }}
        />
        {concepts.length > 0 && (
          <Typography.Text type="secondary" className="tm-help">
            <Tooltip title={t("models.concepts.processingHelp", "New takes are processed within a few seconds before they count for training.")}>
              {t("models.concepts.summary", "{{n}} words and phrases, {{s}} samples", {
                n: concepts.length,
                s: concepts.reduce((sum, c) => sum + c.sampleCount, 0),
              })}
            </Tooltip>
          </Typography.Text>
        )}
      </Card>

      <ConceptVideoModal open={Boolean(videoFor)} modelId={modelId} concept={videoFor} onClose={() => setVideoFor(null)} />

      <Modal
        open={Boolean(renaming)}
        title={t("models.concepts.renameTitle", "Rename “{{label}}”", { label: renaming?.label })}
        okText={t("models.concepts.renameOk", "Rename")}
        confirmLoading={renameState.isLoading}
        onOk={() => doRename().catch(() => {})}
        onCancel={() => setRenaming(null)}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary">
          {t("models.concepts.renameHelp", "Its samples and reference video move to the new name. Using an existing name merges the two.")}
        </Typography.Paragraph>
        <Form form={renameForm} layout="vertical">
          <Form.Item name="newText" label={t("models.concepts.newName", "New name")} rules={[{ required: true, whitespace: true }]}>
            <Input autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
