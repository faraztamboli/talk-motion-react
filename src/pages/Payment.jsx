import React, { useEffect, useState } from "react";
import { Col, Row } from "antd";
import Cart from "../components/ui/Cart";
import CheckoutForm from "../components/ui/payment/CheckoutForm";
import usePayment from "../hooks/usePayment";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  // "pk_test_51MTjNdFiKYZ3UHA3O5m6HW7KBuN8wfvbfgqpzXqrzK4iJW4JpDDRxt1sYynYHS7dk5B1AmbB3q4TQtxb0TTcEZw500WO7YxCZI"
  // "pk_live_51NiVbdDJmqtXI1D7xOmooVhFdbEYEPioIh1NnmmxrD54wOsMyLCM5zhLciRfa2MHpNgx4FKwCnnFRO0R3yZ1NXJt00wlciRBxW"
  "pk_test_51NiVbdDJmqtXI1D7JOC3AvOMWx3cNTp4e2qqeZC90xuR7gGFw6ahyzUwJfkqVmzGGFflLZA0iElxRcc8Kdm4gH0n00RYotWJUc"
);

function Payment() {
  const { purchaseCart } = usePayment();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    console.log("purchaseCart called: pagesPayment.jsx");
    purchaseCart()
      .then((res) => {
        console.log("purchaseCart res:", res);
        const secrets = res.client_secret;
        setClientSecret(res.client_secret);
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
              {clientSecret && clientSecret.length > 8 ? (
                <>
                  <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                  </Elements>
                </>
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
