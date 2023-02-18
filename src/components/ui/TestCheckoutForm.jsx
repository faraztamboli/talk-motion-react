import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ElementsConsumer, PaymentElement } from "@stripe/react-stripe-js";
import usePayment from "../../hooks/usePayment";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  "pk_test_51MTjNdFiKYZ3UHA3O5m6HW7KBuN8wfvbfgqpzXqrzK4iJW4JpDDRxt1sYynYHS7dk5B1AmbB3q4TQtxb0TTcEZw500WO7YxCZI"
  // {
  //   stripeAccount: "acct_1MTjNdFiKYZ3UHA3",
  // }
);

class CheckoutForm extends React.Component {
  handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    const { stripe, elements } = this.props;

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        // return_url: "https://example.com/order/123/complete",
        return_url: "http://localhost:5173/",
      },
    });

    if (result.error) {
      console.log(result.error);
      // Show error to your customer (for example, payment details incomplete)
      console.log(result.error.message);
    } else {
      console.log(result);
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <PaymentElement />
        <button disabled={!this.props.stripe}>Submit</button>
      </form>
    );
  }
}

function InjectedCheckoutForm() {
  return (
    <ElementsConsumer>
      {({ stripe, elements }) => (
        <CheckoutForm stripe={stripe} elements={elements} />
      )}
    </ElementsConsumer>
  );
}

export default function App() {
  const [clientSecret, setClientSecret] = React.useState();
  const { purchaseCart } = usePayment();
  React.useEffect(() => {
    purchaseCart().then((res) => {
      console.log(res);
      console.log(res[24]?.subscription.client_secret);
      setClientSecret(res[24]?.subscription.client_secret);
    });
  }, []);
  const options = {
    // passing the client secret obtained from the server
    clientSecret: clientSecret,
  };

  return (
    clientSecret && (
      <Elements stripe={stripePromise} options={options}>
        <InjectedCheckoutForm />
      </Elements>
    )
  );
}
