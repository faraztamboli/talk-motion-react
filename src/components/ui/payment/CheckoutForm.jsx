/* eslint-disable no-debugger */
import React, { useState, useEffect } from "react";
import {
  ElementsConsumer,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import useMessageApi from "../../../hooks/useMessageApi";
import { Button } from "antd";

function CheckoutForm(props) {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disablePayBtn, setDisablePayBtn] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (!stripe) {
      return;
    }
  }, [stripe]);

  const handleSubmit = async (event) => {
    const { stripe, elements } = props;
    if (!stripe || !elements) {
      return;
    }

    setDisablePayBtn(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://127.0.0.1/5173/payment-successful",
      },
    });

    if (
      error.type === "card_error" ||
      error.type === "validation_error"
    ) {
      showMessage("error", error.message);
    } else {
      showMessage("error", "An unexpected error occurred.");
    }

    setDisablePayBtn(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  return (
    <div className="container">
      <h1>Payment Method</h1>
      <form
        id="payment-form"
        onSubmit={(e) => {
          handleSubmit(e);
          e.preventDefault();
        }}
      >
        <LinkAuthenticationElement
          id="link-authentication-element"
          onChange={(e) => setEmail(e.target.value)}
        />
        <PaymentElement
          id="payment-element"
          options={paymentElementOptions}
        />
        <Button
          disabled={disablePayBtn || !stripe || !elements}
          id="submit"
          type="primary"
          htmlType="submit"
        >
          <span id="button-text">
            {disablePayBtn ? (
              <div className="spinner" id="spinner"></div>
            ) : (
              "Pay now"
            )}
          </span>
        </Button>
      </form>
    </div>
  );
}

export default function InjectedCheckoutForm() {
  return (
    <ElementsConsumer>
      {({ stripe, elements }) => (
        <CheckoutForm stripe={stripe} elements={elements} />
      )}
    </ElementsConsumer>
  );
}
