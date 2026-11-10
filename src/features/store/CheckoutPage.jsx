import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Result, Skeleton, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useCheckoutCartMutation, useGetMyCartQuery, useGetPaymentConfigQuery } from "./storeApi";
import { formatTotals } from "./money";
import TestModeNotice from "./TestModeNotice";
import "../models/models.css";
import "./store.css";

const stripeByKey = new Map();
const stripeFor = (key) => {
  if (!stripeByKey.has(key)) stripeByKey.set(key, loadStripe(key));
  return stripeByKey.get(key);
};

const PENDING_KEY = "tm_pending_checkout";
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

/** Reuse a checkout started in the last 30 minutes for the same cart, instead of opening another. */
export function readPendingCheckout(cartKey, now = Date.now()) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    if (saved && saved.cartKey === cartKey && now - saved.at < PENDING_MAX_AGE_MS && saved.clientSecret) return saved;
  } catch {
    // ignore
  }
  return null;
}

export function savePendingCheckout(entry) {
  try {
    if (entry) sessionStorage.setItem(PENDING_KEY, JSON.stringify(entry));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export const cartKeyOf = (cart) =>
  (cart?.items || [])
    .filter((i) => !i.owned)
    .map((i) => i.product_id)
    .sort((a, b) => a - b)
    .join(",");

function PayForm({ subscriptionId, totals }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const pay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/complete?subscription=${encodeURIComponent(subscriptionId)}`,
      },
    });
    // Only reached when the payment failed before redirecting (card declined, validation...).
    setError(stripeError?.message || t("store.payFailed", "The payment didn't go through."));
    setPaying(false);
  };

  return (
    <form onSubmit={pay}>
      <PaymentElement />
      {error && <Alert type="error" showIcon message={error} className="tm-block-sm" />}
      <Button type="primary" htmlType="submit" size="large" block loading={paying} disabled={!stripe || !elements} className="tm-block">
        {t("store.pay", "Pay {{amount}}", { amount: totals.join(" + ") })}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { data: config, isLoading: loadingConfig } = useGetPaymentConfigQuery();
  const { data: cart, isLoading: loadingCart } = useGetMyCartQuery();
  const [checkout] = useCheckoutCartMutation();
  const [state, setState] = useState({ status: "starting" }); // starting | pay | free-done | error
  const started = useRef(false);
  const totals = useMemo(() => formatTotals(cart?.totals), [cart]);

  useEffect(() => {
    if (started.current || loadingCart || !cart) return;
    started.current = true;
    const key = cartKeyOf(cart);
    if (!key) {
      setState({ status: "empty" });
      return;
    }
    const pending = readPendingCheckout(key);
    if (pending) {
      setState({ status: "pay", clientSecret: pending.clientSecret, subscriptionId: pending.subscriptionId });
      return;
    }
    checkout()
      .unwrap()
      .then((res) => {
        if (res.client_secret) {
          savePendingCheckout({ cartKey: key, clientSecret: res.client_secret, subscriptionId: res.stripe_subscription_id, at: Date.now() });
          setState({ status: "pay", clientSecret: res.client_secret, subscriptionId: res.stripe_subscription_id, freeCount: res.free_granted?.length || 0 });
        } else {
          setState({ status: "free-done", freeCount: res.free_granted?.length || 0 });
        }
      })
      .catch((err) => setState({ status: "error", message: rpcErrorMessage(err, t("store.checkoutFailed", "Checkout couldn't start.")) }));
  }, [cart, checkout, loadingCart, t]);

  return (
    <div className="tm-page tm-narrow">
      <MetaDecorator title={t("store.checkoutTitle", "Checkout")} description={t("store.checkoutTitle", "Checkout")} />
      <Typography.Title level={1} className="tm-page-title">
        {t("store.checkoutTitle", "Checkout")}
      </Typography.Title>
      <TestModeNotice config={config} />
      <Card className="tm-block">
        {state.status === "starting" || loadingConfig ? (
          <Skeleton active />
        ) : state.status === "empty" ? (
          <Result
            title={t("store.cartEmpty", "Your cart is empty.")}
            extra={
              <Link to="/store/models">
                <Button type="primary">{t("store.browse", "Browse the store")}</Button>
              </Link>
            }
          />
        ) : state.status === "error" ? (
          <Result
            status="error"
            title={t("store.checkoutFailed", "Checkout couldn't start.")}
            subTitle={state.message}
            extra={
              <Link to="/store/cart">
                <Button type="primary">{t("store.backToCart", "Back to cart")}</Button>
              </Link>
            }
          />
        ) : state.status === "free-done" ? (
          <Result
            status="success"
            title={t("store.freeDone", "Added to your models")}
            subTitle={t("store.freeDoneBody", "{{count}} free item(s) are now yours.", { count: state.freeCount })}
            extra={
              <Link to="/models">
                <Button type="primary">{t("store.goModels", "Go to my models")}</Button>
              </Link>
            }
          />
        ) : !config?.enabled ? (
          <Alert type="error" showIcon message={t("store.paymentsOff", "Payments aren't available right now. Please try again later.")} />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            {state.freeCount > 0 && (
              <Alert type="success" showIcon message={t("store.freeAdded", "{{count}} free item(s) were added to your models.", { count: state.freeCount })} />
            )}
            <Elements stripe={stripeFor(config.publishable_key)} options={{ clientSecret: state.clientSecret, appearance: { theme: "stripe" } }}>
              <PayForm subscriptionId={state.subscriptionId} totals={totals} />
            </Elements>
            <Typography.Text type="secondary" className="tm-help">
              {t("store.secureNote", "Payments are handled by Stripe. TalkMotion never sees your card number.")}
            </Typography.Text>
          </Space>
        )}
      </Card>
    </div>
  );
}
