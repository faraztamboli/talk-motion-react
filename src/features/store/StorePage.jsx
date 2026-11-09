import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, Input, Pagination, Row, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useListModelsQuery } from "../models/modelsApi";
import { useGetFreeMutation, useGetMyCartQuery, useGetPaymentConfigQuery, useSetCartItemMutation } from "./storeApi";
import { formatPrice } from "./money";
import TestModeNotice from "./TestModeNotice";
import "../models/models.css";
import "./store.css";

const PAGE_SIZE = 12;

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** The action for one store item, from what the viewer already has. */
function StoreAction({ model, inCart }) {
  const { t } = useTranslation();
  const [setCartItem, cartState] = useSetCartItemMutation();
  const [getFree, freeState] = useGetFreeMutation();
  const [messageApi, holder] = message.useMessage();
  const owned = Boolean(model.role);
  const free = !model.priceCents;

  if (owned) {
    return (
      <Link to={`/models/${model.id}`}>
        <Button icon={<CheckOutlined />}>{model.role === "purchaser" ? t("store.open", "Open") : t("store.yours", "Yours")}</Button>
      </Link>
    );
  }
  if (!model.productId) return null;
  const add = async () => {
    try {
      if (free) {
        await getFree(Number(model.productId)).unwrap();
        messageApi.success(t("store.gotFree", "“{{title}}” is now in your models.", { title: model.title }));
      } else {
        await setCartItem({ productId: Number(model.productId), quantity: inCart ? 0 : 1 }).unwrap();
      }
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };
  return (
    <>
      {holder}
      <Button
        type={inCart ? "default" : "primary"}
        icon={!free && <ShoppingCartOutlined />}
        loading={cartState.isLoading || freeState.isLoading}
        onClick={add}
      >
        {free ? t("store.getFree", "Get it free") : inCart ? t("store.removeFromCart", "Remove from cart") : t("store.addToCart", "Add to cart")}
      </Button>
    </>
  );
}

export default function StorePage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sort = params.get("sort") === "title" ? "title" : "recent";
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const { data: config } = useGetPaymentConfigQuery();
  const { data: cart } = useGetMyCartQuery();
  const { data, error, isLoading, isFetching, refetch } = useListModelsQuery({
    scope: "public",
    search: debounced,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sort,
  });
  const rows = data?.rows || [];
  const inCart = new Set((cart?.items || []).map((i) => String(i.product_id)));

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if ((params.get("q") || "") !== debounced) update({ q: debounced, page: null });
  }, [debounced]);

  return (
    <div className="tm-page">
      <MetaDecorator title={t("store.title", "Model store")} description={t("store.description", "Sign recognition models made by the community")} />
      <div className="tm-page-header">
        <div>
          <Typography.Title level={1} className="tm-page-title">
            {t("store.title", "Model store")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("store.subtitle", "Models other people trained. Use one in the Translator, or copy what works into your own.")}
          </Typography.Text>
        </div>
        <Link to="/store/cart">
          <Button icon={<ShoppingCartOutlined />}>
            {t("store.cart", "Cart")} {cart?.count ? `(${cart.count})` : ""}
          </Button>
        </Link>
      </div>
      <TestModeNotice config={config} />
      <Space wrap className="tm-toolbar">
        <Input.Search
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("store.search", "Search the store")}
          aria-label={t("store.search", "Search the store")}
          style={{ width: 280 }}
          loading={isFetching && Boolean(debounced)}
        />
        <Select
          value={sort}
          onChange={(v) => update({ sort: v === "title" ? "title" : null, page: null })}
          options={[
            { value: "recent", label: t("models.sort.recent", "Newest first") },
            { value: "title", label: t("models.sort.title", "Name A–Z") },
          ]}
          style={{ width: 160 }}
          aria-label={t("models.sort.label", "Sort")}
        />
      </Space>
      {error && (
        <Alert
          type="error"
          showIcon
          className="tm-block"
          message={rpcErrorMessage(error, t("store.loadFailed", "The store didn't load."))}
          action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>}
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
          <Empty description={debounced ? t("models.noMatch", "No models match “{{q}}”.", { q: debounced }) : t("store.empty", "Nothing in the store yet.")} />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {rows.map((m) => (
              <Col key={m.id} xs={24} sm={12} xl={8}>
                <Card className="tm-store-card">
                  <Typography.Title level={3} className="tm-model-card-title" ellipsis={{ rows: 2 }}>
                    {m.title}
                  </Typography.Title>
                  <Typography.Text type="secondary">{t("store.by", "by {{owner}}", { owner: m.owner || "–" })}</Typography.Text>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }} className="tm-model-card-desc">
                    {m.description || t("models.card.noDescription", "No description yet.")}
                  </Typography.Paragraph>
                  <div className="tm-store-card-foot">
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong className="tm-price">
                        {formatPrice(m.priceCents, m.currency, m.recurring?.interval)}
                      </Typography.Text>
                      {m.conceptCount != null && (
                        <Typography.Text type="secondary">
                          {t("models.card.concepts", "{{count}} words/phrases", { count: m.conceptCount })}
                        </Typography.Text>
                      )}
                    </Space>
                    <StoreAction model={m} inCart={inCart.has(String(m.productId))} />
                  </div>
                  {m.trained === false && <Tag className="tm-block-sm">{t("models.status.untrained", "Not trained yet")}</Tag>}
                </Card>
              </Col>
            ))}
          </Row>
          {(data?.total || 0) > PAGE_SIZE && (
            <Pagination
              className="tm-pagination"
              current={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              showSizeChanger={false}
              onChange={(p) => update({ page: p > 1 ? String(p) : null })}
            />
          )}
        </>
      )}
    </div>
  );
}
