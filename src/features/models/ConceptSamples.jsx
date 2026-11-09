import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, Modal, Row, Skeleton, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useModelContext } from "./ModelPage";
import { useDeleteSamplesMutation, useGetConceptSamplesQuery, useGetSampleFramesQuery } from "./modelsApi";
import SampleReplay from "./SampleReplay";

const HAND = { 1: "Right", 2: "Left", 3: "Both" };
const FLAG = {
  unusual_length: { label: "Unusual length", help: "Much shorter or longer than this word's other samples." },
  hands_often_missing: { label: "Hands missing", help: "Hands were out of view for much of this take." },
};

export const formatSeconds = (ms) => (ms == null ? "–" : `${(ms / 1000).toFixed(1)} s`);

function Replay({ modelId, concept, sampleId }) {
  const { t } = useTranslation();
  const { data, error, isFetching } = useGetSampleFramesQuery({ modelId, concept, sampleId });
  if (isFetching) return <Skeleton.Node active style={{ width: "100%", height: 200 }} />;
  if (error) return <Alert type="error" showIcon message={rpcErrorMessage(error, t("models.samples.replayFailed", "This sample couldn't be loaded."))} />;
  return <SampleReplay frames={data?.frames || []} />;
}

export default function ConceptSamples() {
  const { t } = useTranslation();
  const { concept: rawConcept } = useParams();
  const concept = decodeURIComponent(rawConcept || "");
  const { model, modelId } = useModelContext();
  const canTrain = model.permissions.train;
  const { data, error, isLoading, refetch } = useGetConceptSamplesQuery({ modelId, concept }, { skip: !canTrain });
  const [deleteSamples, deleteState] = useDeleteSamplesMutation();
  const [selected, setSelected] = useState([]);
  const [replayId, setReplayId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();

  const rows = useMemo(() => {
    const ready = (data?.samples || []).map((s) => ({ ...s, key: `s-${s.sample_id}` }));
    const pending = (data?.pending || []).map((s) => ({ ...s, key: `p-${s.pending_file}` }));
    return [...pending, ...ready];
  }, [data]);

  if (!canTrain) {
    return (
      <Alert type="info" showIcon message={t("models.samples.noAccess", "Only the model's owner and trainers can see its samples.")} />
    );
  }

  const remove = (ids) =>
    modal.confirm({
      title: t("models.samples.deleteTitle", "Delete {{count}} sample(s)?", { count: ids.length }),
      content: t("models.samples.deleteBody", "They won't be used the next time the model is trained."),
      okText: t("models.concepts.deleteOk", "Delete"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteSamples({ modelId, concept, sampleIds: ids }).unwrap();
          setSelected([]);
          if (ids.includes(replayId)) setReplayId(null);
          messageApi.success(t("models.samples.deleted", "Deleted {{count}} sample(s).", { count: res.deleted }));
        } catch (err) {
          messageApi.error(rpcErrorMessage(err));
        }
      },
    });

  const columns = [
    {
      title: "#",
      dataIndex: "sample_id",
      width: 70,
      render: (id, s) => (s.status === "processing" ? <Tag color="processing">{t("models.samples.processing", "Processing")}</Tag> : id),
    },
    {
      title: t("models.samples.recorded", "Recorded"),
      dataIndex: "recorded_at",
      render: (v) => (v ? new Date(v).toLocaleString() : "–"),
      responsive: ["md"],
    },
    { title: t("models.samples.length", "Length"), dataIndex: "duration_ms", render: formatSeconds },
    { title: t("models.samples.frames", "Frames"), dataIndex: "frame_count", render: (v) => v ?? "–", responsive: ["sm"] },
    {
      title: t("models.samples.hands", "Hands"),
      key: "hands",
      responsive: ["md"],
      render: (_, s) =>
        s.status === "processing" ? "–" : (
          <span>
            {t(`models.samples.hand.${s.which_hand}`, HAND[s.which_hand] || "None")}
            {s.hands_visible_ratio != null && ` · ${Math.round(s.hands_visible_ratio * 100)}%`}
          </span>
        ),
    },
    {
      title: t("models.samples.quality", "Check"),
      dataIndex: "flags",
      render: (flags = []) =>
        flags.length ? (
          flags.map((f) => (
            <Tooltip key={f} title={t(`models.samples.flagHelp.${f}`, FLAG[f]?.help || f)}>
              <Tag color="warning">{t(`models.samples.flag.${f}`, FLAG[f]?.label || f)}</Tag>
            </Tooltip>
          ))
        ) : (
          <Typography.Text type="secondary">{t("models.samples.ok", "Looks fine")}</Typography.Text>
        ),
    },
    {
      key: "replay",
      align: "right",
      render: (_, s) =>
        s.status === "ready" && (
          <Button size="small" type={replayId === s.sample_id ? "primary" : "default"} onClick={() => setReplayId(s.sample_id)}>
            {t("models.samples.replay", "Replay")}
          </Button>
        ),
    },
  ];

  return (
    <div className="tm-tab">
      {contextHolder}
      {modalHolder}
      <Space className="tm-block-sm" wrap>
        <Link to={`/models/${modelId}/concepts`}>
          <Button icon={<ArrowLeftOutlined />}>{t("models.samples.back", "All words and phrases")}</Button>
        </Link>
        <Link to={`/models/${modelId}/collect?concept=${encodeURIComponent(concept)}`}>
          <Button type="primary">{t("models.samples.recordMore", "Record more")}</Button>
        </Link>
      </Space>
      <Typography.Title level={2} className="tm-section-title">
        {t("models.samples.title", "Samples of “{{concept}}”", { concept })}
      </Typography.Title>
      {error && (
        <Alert
          type="error"
          showIcon
          className="tm-block"
          message={rpcErrorMessage(error)}
          action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>}
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={replayId ? 14 : 24}>
          <Card>
            {selected.length > 0 && (
              <Space className="tm-block-sm">
                <Typography.Text>{t("models.samples.selected", "{{count}} selected", { count: selected.length })}</Typography.Text>
                <Button danger size="small" loading={deleteState.isLoading} onClick={() => remove(selected)}>
                  {t("models.samples.deleteSelected", "Delete selected")}
                </Button>
              </Space>
            )}
            <Table
              rowKey={(s) => (s.sample_id != null ? s.sample_id : s.key)}
              columns={columns}
              dataSource={rows}
              loading={isLoading}
              size="small"
              scroll={{ x: 520 }}
              pagination={rows.length > 30 ? { pageSize: 30, showSizeChanger: false } : false}
              rowSelection={{
                selectedRowKeys: selected,
                onChange: setSelected,
                getCheckboxProps: (s) => ({ disabled: s.status !== "ready" }),
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t("models.samples.empty", "No samples yet. Record a few takes of this word.")}
                  />
                ),
              }}
            />
          </Card>
        </Col>
        {replayId != null && (
          <Col xs={24} lg={10}>
            <Card
              title={t("models.samples.replayTitle", "Sample {{id}}", { id: replayId })}
              extra={
                <Space>
                  <Button size="small" danger onClick={() => remove([replayId])}>
                    {t("models.concepts.deleteOk", "Delete")}
                  </Button>
                  <Button size="small" onClick={() => setReplayId(null)}>
                    {t("common.close", "Close")}
                  </Button>
                </Space>
              }
            >
              <Replay modelId={modelId} concept={concept} sampleId={replayId} />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
