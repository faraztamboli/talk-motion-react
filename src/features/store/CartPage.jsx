import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Empty, List, Space, Tag, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useGetMyCartQuery, useGetPaymentConfigQuery, useSetCartItemMutation } from "./storeApi";
import { formatPrice, formatTotals } from "./money";
import TestModeNotice from "./TestModeNotice";
import "../models/models.css";
import "./store.css";

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: cart, error, isLoading, refetch } = useGetMyCartQuery();
  const { data: config } = useGetPaymentConfigQuery();
  const [setCartItem, setState] = useSetCartItemMutation();
  const [messageApi, holder] = message.useMessage();
  const items = cart?.items || [];
  const buyable = items.filter((i) => !i.owned);
  const unavailable = buyable.filter((i) => !i.sellable);
  const totals = formatTotals(cart?.totals);

  const remove = async (productId) => {
    try {
      await setCartItem({ productId, quantity: 0 }).unwrap();
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  return (
    <div className="tm-page tm-narrow">
      {holder}
      <MetaDecorator title={t("store.cartTitle", "Your cart")} description={t("store.cartTitle", "Your cart")} />
      <Typography.Title level={1} className="tm-page-title">
        {t("store.cartTitle", "Your cart")}
      </Typography.Title>
      <TestModeNotice config={config} />
      {error && (
        <Alert type="error" showIcon message={rpcErrorMessage(error)} action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>} />
      )}
      <Card className="tm-block" loading={isLoading}>
        {items.length === 0 ? (
          <Empty description={t("store.cartEmpty", "Your cart is empty.")}>
            <Link to="/store/models">
              <Button type="primary">{t("store.browse", "Browse the store")}</Button>
            </Link>
          </Empty>
        ) : (
          <>
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="r" type="link" danger onClick={() => remove(item.product_id)} loading={setState.isLoading}>
                      {t("store.remove", "Remove")}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      item.model_id ? <Link to={`/models/${item.model_id}`}>{item.name}</Link> : item.name
                    }
                    description={
                      <Space wrap size={[8, 4]}>
                        <Tag bordered={false}>{item.kind === "video" ? t("store.kind.video", "Video") : t("store.kind.model", "Model")}</Tag>
                        {item.owned && <Tag color="success">{t("store.alreadyYours", "Already yours")}</Tag>}
                        {!item.owned && !item.sellable && <Tag color="warning">{t("store.notForSale", "Not for sale right now")}</Tag>}
                      </Space>
                    }
                  />
                  <Typography.Text strong>{formatPrice(item.price, item.currency, item.interval)}</Typography.Text>
                </List.Item>
              )}
            />
            <div className="tm-cart-total">
              <Typography.Text>{t("store.total", "Total")}</Typography.Text>
              <Typography.Text strong>{totals.length ? totals.join(" + ") : t("store.free", "Free")}</Typography.Text>
            </div>
            {totals.some((x) => x.includes("/")) && (
              <Typography.Paragraph type="secondary" className="tm-help">
                {t("store.recurringNote", "Subscriptions renew automatically. Cancel any time from My purchases.")}
              </Typography.Paragraph>
            )}
            {unavailable.length > 0 && (
              <Alert
                type="warning"
                showIcon
                className="tm-block-sm"
                message={t("store.removeUnavailable", "Remove the items that aren't for sale to check out.")}
              />
            )}
            <Space className="tm-block">
              <Button
                type="primary"
                size="large"
                disabled={!buyable.length || unavailable.length > 0}
                onClick={() => navigate("/store/checkout")}
              >
                {t("store.checkout", "Check out")}
              </Button>
              <Link to="/store/models">
                <Button size="large">{t("store.keepShopping", "Keep shopping")}</Button>
              </Link>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
}
