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
      debugger;
      return;
    }
  }, [stripe]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { stripe, elements } = props;
    if (!stripe || !elements) {
      debugger;
      return;
    }

    setDisablePayBtn(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000",
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
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
      <form id="payment-form" onSubmit={handleSubmit}>
        <LinkAuthenticationElement
          id="link-authentication-element"
          onChange={(e) => setEmail(e.target.value)}
        />
        <PaymentElement id="payment-element" options={paymentElementOptions} />
        <button disabled={isLoading || !stripe || !elements} id="submit">
          <span id="button-text">
            {isLoading ? (
              <div className="spinner" id="spinner"></div>
            ) : (
              "Pay now"
            )}
          </span>
        </button>
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
