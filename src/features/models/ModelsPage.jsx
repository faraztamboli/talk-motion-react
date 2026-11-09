import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import ErrorBoundary from "../../components/ErrorBoundary";
import { rpcErrorMessage } from "../../api/rpc";
import { useCreateModelMutation, useListModelsQuery } from "./modelsApi";
import ModelFormModal from "./ModelFormModal";
import { modelStatus, ROLE_LABEL } from "./modelStatus";
import "./models.css";

const PAGE_SIZE = 12;

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function ModelCard({ model }) {
  const { t } = useTranslation();
  const status = modelStatus(model);
  return (
    <Link to={`/models/${model.id}`} className="tm-model-card-link" aria-label={model.title}>
      <Card hoverable className="tm-model-card">
        <div className="tm-model-card-head">
          <Typography.Title level={3} className="tm-model-card-title" ellipsis={{ rows: 2 }}>
            {model.title}
          </Typography.Title>
          {model.role && <Tag bordered={false}>{t(`models.role.${model.role}`, ROLE_LABEL[model.role])}</Tag>}
        </div>
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="tm-model-card-desc">
          {model.description || t("models.card.noDescription", "No description yet.")}
        </Typography.Paragraph>
        <div className="tm-model-card-stats">
          {status.label && <Tag color={status.color}>{t(`models.status.${status.key}`, status.label)}</Tag>}
          {model.conceptCount != null && (
            <span>{t("models.card.concepts", "{{count}} words/phrases", { count: model.conceptCount })}</span>
          )}
          {model.sampleCount != null && <span>{t("models.card.samples", "{{count}} samples", { count: model.sampleCount })}</span>}
        </div>
        <div className="tm-model-card-foot">
          <Avatar.Group maxCount={4} size="small">
            {model.trainers.map((tr) => (
              <Tooltip key={tr.username} title={tr.fullname || tr.username}>
                <Avatar src={tr.sm_img || undefined} icon={!tr.sm_img && <UserOutlined />} alt={tr.username} />
              </Tooltip>
            ))}
          </Avatar.Group>
          {model.isPublic && <Tag color="blue">{t("models.card.public", "Public")}</Tag>}
        </div>
      </Card>
    </Link>
  );
}

export default function ModelsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const scope = params.get("show") === "trainable" ? "trainable" : "mine";
  const sort = params.get("sort") === "title" ? "title" : "recent";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [createModel, { isLoading: saving }] = useCreateModelMutation();

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // New search text starts from page 1.
  useEffect(() => {
    if ((params.get("q") || "") !== debounced) update({ q: debounced, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, isLoading, isFetching, refetch } = useListModelsQuery({
    scope,
    search: debounced,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sort,
  });
  const rows = data?.rows || [];
  const total = data?.total || 0;

  const onCreate = async (values) => {
    setCreateError(null);
    try {
      const res = await createModel(values).unwrap();
      setCreating(false);
      messageApi.success(t("models.created", "Model created. Next: add the words and phrases it should know."));
      if (res?.model_id) navigate(`/models/${res.model_id}/concepts`);
    } catch (err) {
      setCreateError(rpcErrorMessage(err, t("models.createFailed", "We couldn't create the model.")));
      throw err;
    }
  };

  return (
    <div className="tm-page">
      <MetaDecorator title={t("models.pageTitle", "My models")} description={t("models.pageDescription", "Models you own, train or bought")} />
      {contextHolder}
      <div className="tm-page-header">
        <div>
          <Typography.Title level={1} className="tm-page-title">
            {t("models.heading", "My models")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("models.subheading", "A model learns the signs you record and turns them into words in the Translator.")}
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          {t("models.new", "New model")}
        </Button>
      </div>

      <Space wrap className="tm-toolbar">
        <Input.Search
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("models.search", "Search by name or description")}
          aria-label={t("models.search", "Search by name or description")}
          style={{ width: 280 }}
          loading={isFetching && Boolean(debounced)}
        />
        <Segmented
          value={scope}
          onChange={(v) => update({ show: v === "trainable" ? "trainable" : null, page: null })}
          options={[
            { label: t("models.filter.all", "All my models"), value: "mine" },
            { label: t("models.filter.trainable", "I can train"), value: "trainable" },
          ]}
        />
        <Select
          value={sort}
          onChange={(v) => update({ sort: v === "title" ? "title" : null, page: null })}
          options={[
            { value: "recent", label: t("models.sort.recent", "Newest first") },
            { value: "title", label: t("models.sort.title", "Name A–Z") },
          ]}
          aria-label={t("models.sort.label", "Sort")}
          style={{ width: 160 }}
        />
      </Space>

      {error && (
        <Alert
          type="error"
          showIcon
          message={rpcErrorMessage(error, t("models.loadFailed", "We couldn't load your models."))}
          action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>}
          className="tm-block"
        />
      )}

      {isLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }, (_, i) => (
            <Col key={i} xs={24} sm={12} xl={8}>
              <Card>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : rows.length === 0 && !error ? (
        <Card className="tm-empty-card">
          {debounced ? (
            <Empty description={t("models.noMatch", "No models match “{{q}}”.", { q: debounced })} />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>{t("models.emptyTitle", "You don't have a model yet")}</Typography.Text>
                  <Typography.Text type="secondary">
                    {t(
                      "models.emptyBody",
                      "Create a model, add the words and phrases it should know, record a few samples of each, then train it."
                    )}
                  </Typography.Text>
                </Space>
              }
            >
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                  {t("models.createFirst", "Create your first model")}
                </Button>
                <Link to="/store/models">
                  <Button>{t("models.browseStore", "Browse the store")}</Button>
                </Link>
              </Space>
            </Empty>
          )}
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {rows.map((m) => (
              <Col key={m.id} xs={24} sm={12} xl={8}>
                <ErrorBoundary compact>
                  <ModelCard model={m} />
                </ErrorBoundary>
              </Col>
            ))}
          </Row>
          {total > PAGE_SIZE && (
            <Pagination
              className="tm-pagination"
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              onChange={(p) => update({ page: p > 1 ? String(p) : null })}
            />
          )}
        </>
      )}

      <ModelFormModal
        open={creating}
        onCancel={() => {
          setCreating(false);
          setCreateError(null);
        }}
        onSubmit={onCreate}
        submitting={saving}
        error={createError}
      />
    </div>
  );
}
