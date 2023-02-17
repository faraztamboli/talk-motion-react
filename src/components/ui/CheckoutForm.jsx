import React, { useState } from "react";
import { CardElement, ElementsConsumer } from "@stripe/react-stripe-js";
import CardSection from "./CardSection";
import { useNavigate } from "react-router-dom";
import useMessageApi from "../../hooks/useMessageApi";

function CheckoutForm(props) {
  const [error, setError] = useState(null);
  const [disablePayBtn, setDisablePayBtn] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDisablePayBtn(true);

    const { stripe, elements } = props;
    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardElement);
    const result = await stripe.createToken(card);
    if (result.error) {
      setError(result.error.message);
      showMessage("error", "Unable to process payment");
      setDisablePayBtn(false);
    } else {
      console.log(result.token);
      showMessage("success", "Payment succeed!");
      setTimeout(() => {
        navigate("/models");
      }, 3000);
    }
  };

  return (
    <div>
      {contextHolder}
      <div className="product-info">
        <h3 className="product-title">TalkMotion Payment</h3>
        <h4 className="product-price align-text-center">$999</h4>
      </div>
      <form onSubmit={handleSubmit}>
        <CardSection />
        {error && <div className="error-message">{error}</div>}
        <button disabled={!props.stripe || disablePayBtn} className="btn-pay">
          Pay
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
