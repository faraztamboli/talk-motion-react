import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Card, InputNumber, Select, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useGetPaymentConfigQuery, useSetModelSaleMutation, useStopModelSaleMutation } from "./storeApi";
import { formatPrice, toCents } from "./money";

/** Owner's control for offering a model in the store, for a monthly price or for free. */
export default function SellCard({ model }) {
  const { t } = useTranslation();
  const { data: config } = useGetPaymentConfigQuery();
  const [setSale, saleState] = useSetModelSaleMutation();
  const [stopSale, stopState] = useStopModelSaleMutation();
  const [messageApi, holder] = message.useMessage();
  const [price, setPrice] = useState(model.priceCents ? model.priceCents / 100 : 0);
  const [currency, setCurrency] = useState(model.currency || "usd");
  const [error, setError] = useState(null);
  const selling = Boolean(model.isPublic && model.productId);

  useEffect(() => {
    setPrice(model.priceCents ? model.priceCents / 100 : 0);
    setCurrency(model.currency || "usd");
  }, [model.priceCents, model.currency]);

  const save = async () => {
    setError(null);
    const cents = toCents(price);
    if (cents == null) {
      setError(t("store.sell.badPrice", "Enter a price, or 0 for free."));
      return;
    }
    try {
      await setSale({ modelId: model.id, priceCents: cents, currency }).unwrap();
      messageApi.success(cents ? t("store.sell.saved", "It's in the store for {{price}}.", { price: formatPrice(cents, currency, "month") }) : t("store.sell.savedFree", "It's in the store for free."));
    } catch (err) {
      setError(rpcErrorMessage(err));
    }
  };

  const stop = async () => {
    setError(null);
    try {
      await stopSale(model.id).unwrap();
      messageApi.success(t("store.sell.stopped", "Taken out of the store. People who bought it keep access."));
    } catch (err) {
      setError(rpcErrorMessage(err));
    }
  };

  return (
    <Card title={t("store.sell.title", "Offer in the store")} className="tm-block-sm">
      {holder}
      <Typography.Paragraph type="secondary">
        {selling
          ? t("store.sell.selling", "Listed for {{price}}. Buyers can use it in the Translator; they can't see your samples.", {
              price: formatPrice(model.priceCents, model.currency, "month"),
            })
          : t("store.sell.help", "List this model so other people can use it. Charge a monthly price, or offer it for free.")}
      </Typography.Paragraph>
      {config && !config.enabled && (
        <Alert type="info" showIcon className="tm-block-sm" message={t("store.sell.freeOnly", "Paid listings aren't available yet; you can list it for free.")} />
      )}
      <Space wrap>
        <InputNumber
          min={0}
          max={1000}
          step={0.5}
          precision={2}
          value={price}
          onChange={setPrice}
          addonAfter={t("store.sell.perMonth", "per month")}
          aria-label={t("store.sell.price", "Monthly price")}
        />
        <Select
          value={currency}
          onChange={setCurrency}
          options={(config?.currencies || ["usd", "cad"]).map((c) => ({ value: c, label: c.toUpperCase() }))}
          aria-label={t("store.sell.currency", "Currency")}
          style={{ width: 90 }}
        />
        <Button type="primary" onClick={save} loading={saleState.isLoading}>
          {selling ? t("store.sell.update", "Update price") : t("store.sell.list", "List in the store")}
        </Button>
        {selling && (
          <Button onClick={stop} loading={stopState.isLoading}>
            {t("store.sell.stop", "Take out of the store")}
          </Button>
        )}
      </Space>
      {error && <Alert type="error" showIcon message={error} className="tm-block-sm" />}
    </Card>
  );
}

SellCard.propTypes = { model: PropTypes.object.isRequired };
