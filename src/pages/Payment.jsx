import React, { useEffect, useState } from "react";
import { Col, Row } from "antd";
import Cart from "../components/ui/Cart";
import CheckoutForm from "../components/ui/payment/CheckoutForm";
import usePayment from "../hooks/usePayment";
import useModels from "../hooks/useModels";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  "pk_test_51MTjNdFiKYZ3UHA3O5m6HW7KBuN8wfvbfgqpzXqrzK4iJW4JpDDRxt1sYynYHS7dk5B1AmbB3q4TQtxb0TTcEZw500WO7YxCZI"
);

function Payment() {
  const { getCart, purchaseCart } = usePayment();
  const { addOrRemoveCartProduct } = useModels();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    purchaseCart()
      .then((res) => {
        debugger;
        const newArray = Object.keys(res).map((id) => ({
          id: id,
          client_secret: res[id].subscription["client_secret"],
        }));
        const secrets = newArray.map((item) => item.client_secret);
        setClientSecret(secrets[Object.keys(res).length - 1]);
      })
      .catch((err) => console.log(err));
  }, []);

  const appearance = {
    theme: "stripe",
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <>
      {
        <div className="purchase-model-list">
          <Row>
            <Col
              span={12}
              xs={24}
              lg={12}
              className="payment-first-col"
            >
              <Cart />
            </Col>
            <Col
              span={12}
              xs={24}
              lg={12}
              className="payment-second-col"
            >
              {clientSecret.length > 8 ? (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm />
                </Elements>
              ) : (
                <h1>Client Secret Not Set!</h1>
              )}
            </Col>
          </Row>
        </div>
      }
    </>
  );
}

export default Payment;
