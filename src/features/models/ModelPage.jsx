import React from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Breadcrumb, Button, Result, Skeleton, Space, Tabs, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import ErrorBoundary from "../../components/ErrorBoundary";
import { rpcErrorMessage } from "../../api/rpc";
import { useGetModelDetailsQuery } from "./modelsApi";
import { modelStatus, ROLE_LABEL } from "./modelStatus";
import "./models.css";

const TABS = [
  { key: "", label: "Overview" },
  { key: "concepts", label: "Words & phrases" },
  { key: "collect", label: "Record", needs: "train" },
  { key: "train", label: "Train", needs: "train" },
  { key: "trainers", label: "Trainers" },
  { key: "settings", label: "Settings", needs: "manage" },
];

/** Shared by the tabs: { model, modelId, refetch }. */
export const useModelContext = () => useOutletContext();

export default function ModelPage() {
  const { t } = useTranslation();
  const { modelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: model, error, isLoading, refetch } = useGetModelDetailsQuery(modelId);

  const base = `/models/${modelId}`;
  const rest = location.pathname.slice(base.length).replace(/^\//, "");
  const active = rest.split("/")[0] || "";

  if (isLoading) {
    return (
      <div className="tm-page">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (error || !model) {
    const notFound = /not found|can't see/i.test(error?.message || "");
    return (
      <div className="tm-page">
        <Result
          status={notFound ? "404" : "error"}
          title={notFound ? t("models.notFound", "We can't find that model") : t("models.loadOneFailed", "The model didn't load")}
          subTitle={
            notFound
              ? t("models.notFoundBody", "It may have been deleted, or it belongs to someone else.")
              : rpcErrorMessage(error)
          }
          extra={[
            <Link key="back" to="/models">
              <Button type="primary">{t("models.backToList", "Back to my models")}</Button>
            </Link>,
            !notFound && (
              <Button key="retry" onClick={refetch}>
                {t("common.tryAgain", "Try again")}
              </Button>
            ),
          ]}
        />
      </div>
    );
  }

  const perms = model.permissions;
  const status = modelStatus(model);
  const tabs = TABS.filter((tab) => !tab.needs || perms[tab.needs]).map((tab) => ({
    key: tab.key,
    label: t(`models.tabs.${tab.key || "overview"}`, tab.label),
  }));

  return (
    <div className="tm-page">
      <MetaDecorator title={model.title} description={model.description || t("models.pageTitle", "My models")} />
      <Breadcrumb
        className="tm-breadcrumb"
        items={[{ title: <Link to="/models">{t("models.heading", "My models")}</Link> }, { title: model.title }]}
      />
      <div className="tm-page-header">
        <div>
          <Typography.Title level={1} className="tm-page-title">
            {model.title}
          </Typography.Title>
          <Space wrap size={[8, 4]}>
            {status.label && <Tag color={status.color}>{t(`models.status.${status.key}`, status.label)}</Tag>}
            {model.role && <Tag bordered={false}>{t(`models.role.${model.role}`, ROLE_LABEL[model.role])}</Tag>}
            {model.isPublic && <Tag color="blue">{t("models.card.public", "Public")}</Tag>}
            {model.description && <Typography.Text type="secondary">{model.description}</Typography.Text>}
          </Space>
        </div>
        {perms.use && model.trained && (
          <Link to={`/converter?model=${model.id}`}>
            <Button type="primary">{t("models.tryInTranslator", "Try it in the Translator")}</Button>
          </Link>
        )}
      </div>
      <Tabs
        activeKey={active}
        items={tabs}
        onChange={(key) => navigate(key ? `${base}/${key}` : base)}
        className="tm-model-tabs"
      />
      <ErrorBoundary resetKey={location.pathname}>
        <Outlet context={{ model, modelId: String(model.id), refetch }} />
      </ErrorBoundary>
    </div>
  );
}
