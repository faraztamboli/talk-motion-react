import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Result, Spin } from "antd";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useConfirmCheckoutMutation } from "./storeApi";
import { savePendingCheckout } from "./CheckoutPage";
import "../models/models.css";
import "./store.css";

const RETRIES = 6;
const RETRY_MS = 2500;

/**
 * Stripe sends the buyer back here. The server asks Stripe whether the subscription is paid
 * (never trusting redirect_status in the URL) and grants access; while Stripe is still
 * processing, check again a few times.
 */
export default function CheckoutCompletePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const subscriptionId = params.get("subscription");
  const redirectStatus = params.get("redirect_status");
  const [confirm] = useConfirmCheckoutMutation();
  const [state, setState] = useState({ status: "checking" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    // Drop Stripe's parameters from the address bar so a refresh doesn't look like a new payment.
    if (params.get("payment_intent")) navigate(`/store/checkout/complete?subscription=${encodeURIComponent(subscriptionId || "")}`, { replace: true });
    if (!subscriptionId) {
      setState({ status: "unknown" });
      return;
    }
    let attempt = 0;
    let timer;
    const check = async () => {
      attempt += 1;
      try {
        const res = await confirm(subscriptionId).unwrap();
        if (res.access === true) {
          savePendingCheckout(null);
          setState({ status: "paid" });
        } else if (res.access === false) {
          savePendingCheckout(null);
          setState({ status: "failed" });
        } else if (attempt < RETRIES) {
          timer = setTimeout(check, RETRY_MS);
        } else {
          setState({ status: "processing" });
        }
      } catch (err) {
        if (attempt < RETRIES && (err?.code === "timeout" || err?.code === "disconnected")) timer = setTimeout(check, RETRY_MS);
        else setState({ status: "error", message: rpcErrorMessage(err) });
      }
    };
    check();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tm-page tm-narrow">
      <MetaDecorator title={t("store.completeTitle", "Payment")} description={t("store.completeTitle", "Payment")} />
      <Card>
        {state.status === "checking" && (
          <Result
            icon={<Spin size="large" />}
            title={t("store.confirming", "Confirming your payment…")}
            subTitle={redirectStatus === "failed" ? t("store.confirmingFailed", "Stripe reported a problem; checking with them.") : null}
          />
        )}
        {state.status === "paid" && (
          <Result
            status="success"
            title={t("store.paid", "Thank you! Your purchase is ready.")}
            extra={[
              <Link key="models" to="/models">
                <Button type="primary">{t("store.goModels", "Go to my models")}</Button>
              </Link>,
              <Link key="p" to="/store/purchases">
                <Button>{t("store.viewPurchases", "My purchases")}</Button>
              </Link>,
            ]}
          />
        )}
        {state.status === "processing" && (
          <Result
            status="info"
            title={t("store.processing", "Your payment is still processing")}
            subTitle={t("store.processingBody", "This can take a minute. Your purchase appears in My purchases as soon as it's confirmed.")}
            extra={
              <Link to="/store/purchases">
                <Button type="primary">{t("store.viewPurchases", "My purchases")}</Button>
              </Link>
            }
          />
        )}
        {state.status === "failed" && (
          <Result
            status="error"
            title={t("store.notPaid", "The payment didn't go through")}
            subTitle={t("store.notPaidBody", "You weren't charged. You can try again with another card.")}
            extra={
              <Link to="/store/cart">
                <Button type="primary">{t("store.backToCart", "Back to cart")}</Button>
              </Link>
            }
          />
        )}
        {(state.status === "error" || state.status === "unknown") && (
          <Result
            status="warning"
            title={t("store.cantConfirm", "We couldn't confirm this payment")}
            subTitle={state.message || t("store.cantConfirmBody", "Check My purchases; if you were charged it will appear there.")}
            extra={
              <Link to="/store/purchases">
                <Button type="primary">{t("store.viewPurchases", "My purchases")}</Button>
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
