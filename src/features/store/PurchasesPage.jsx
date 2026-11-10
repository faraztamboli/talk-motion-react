import React from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Empty, Modal, Table, Tag, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useCancelPurchaseMutation, useListMyPurchasesQuery } from "./storeApi";
import { formatPrice } from "./money";
import "../models/models.css";
import "./store.css";

const STATUS = {
  active: { color: "success", label: "Active" },
  pending: { color: "processing", label: "Payment pending" },
  inactive: { color: "default", label: "Ended" },
};

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { data: purchases = [], error, isLoading, refetch } = useListMyPurchasesQuery();
  const [cancelPurchase, cancelState] = useCancelPurchaseMutation();
  const [messageApi, holder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();

  const cancel = (p) =>
    modal.confirm({
      title: t("store.cancelTitle", "Cancel “{{name}}”?", { name: p.name }),
      content: t("store.cancelBody", "You'll stop being charged and lose access to it. You can buy it again later."),
      okText: t("store.cancelOk", "Cancel subscription"),
      okButtonProps: { danger: true },
      cancelText: t("store.keep", "Keep it"),
      onOk: async () => {
        try {
          await cancelPurchase(p.product_id).unwrap();
          messageApi.success(t("store.cancelled", "Cancelled."));
        } catch (err) {
          messageApi.error(rpcErrorMessage(err));
        }
      },
    });

  const columns = [
    {
      title: t("store.item", "Item"),
      dataIndex: "name",
      render: (name, p) => (p.model_id ? <Link to={`/models/${p.model_id}`}>{name}</Link> : name),
    },
    {
      title: t("store.price", "Price"),
      key: "price",
      render: (_, p) => formatPrice(p.price, p.currency, p.interval),
    },
    {
      title: t("store.since", "Since"),
      dataIndex: "purchased_at",
      responsive: ["md"],
      render: (v) => (v ? new Date(v).toLocaleDateString() : "–"),
    },
    {
      title: t("store.status", "Status"),
      dataIndex: "status",
      render: (s) => <Tag color={STATUS[s]?.color}>{t(`store.statusLabel.${s}`, STATUS[s]?.label || s)}</Tag>,
    },
    {
      key: "actions",
      align: "right",
      render: (_, p) =>
        p.can_cancel && (
          <Button size="small" danger onClick={() => cancel(p)} loading={cancelState.isLoading}>
            {t("store.cancel", "Cancel")}
          </Button>
        ),
    },
  ];

  return (
    <div className="tm-page">
      {holder}
      {modalHolder}
      <MetaDecorator title={t("store.purchasesTitle", "My purchases")} description={t("store.purchasesTitle", "My purchases")} />
      <Typography.Title level={1} className="tm-page-title">
        {t("store.purchasesTitle", "My purchases")}
      </Typography.Title>
      {error && (
        <Alert type="error" showIcon message={rpcErrorMessage(error)} action={<Button onClick={refetch}>{t("common.tryAgain", "Try again")}</Button>} />
      )}
      <Card className="tm-block">
        <Table
          rowKey={(p) => `${p.product_id}`}
          columns={columns}
          dataSource={purchases}
          loading={isLoading}
          pagination={purchases.length > 20 ? { pageSize: 20 } : false}
          scroll={{ x: 520 }}
          locale={{
            emptyText: (
              <Empty description={t("store.noPurchases", "You haven't bought anything yet.")}>
                <Link to="/store/models">
                  <Button type="primary">{t("store.browse", "Browse the store")}</Button>
                </Link>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
}
