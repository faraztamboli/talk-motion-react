import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import usePayment from "../../hooks/usePayment";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

const stripePromise = loadStripe(
  "pk_test_51MTjNdFiKYZ3UHA3O5m6HW7KBuN8wfvbfgqpzXqrzK4iJW4JpDDRxt1sYynYHS7dk5B1AmbB3q4TQtxb0TTcEZw500WO7YxCZI"
);

export default function App() {
  const [clientSecrets, setClientSecrets] = useState(null);
  const { purchaseCart } = usePayment();

  useEffect(() => {
    purchaseCart()
      .then((res) => {
        console.log(res);
        const newArray = Object.keys(res).map((id) => ({
          id: id,
          client_secret: res[id].subscription["client_secret"],
        }));
        console.log(newArray);
        const secrets = newArray.map((item) => item.client_secret);
        setClientSecrets(secrets.join(","));
      })
      .catch((err) => console.log(err));
  }, []);

  const options = {
    // passing the client secret obtained from the server
    clientSecret: clientSecrets,
    appearance: {
      theme: "flat",
    },
  };

  return (
    clientSecrets && (
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm clientSecret={clientSecrets} />
      </Elements>
    )
  );
}
