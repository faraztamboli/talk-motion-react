import React from "react";
import { Col, Row } from "antd";
import Cart from "../components/ui/Cart";
import PaymentForm from "../components/ui/PaymentForm";
import usePayment from "../hooks/usePayment";
import useModels from "../hooks/useModels";

function Payment() {
  const { getCart } = usePayment();
  const { setCartProductQuantity } = useModels();
  return (
    <>
      <div className="purchase-model-list ">
        <Row>
          <Col span={12} xs={24} lg={12} className="payment-first-col">
            <Cart
              getCart={getCart}
              setCartProductQuantity={setCartProductQuantity}
            />
          </Col>
          <Col span={12} xs={24} lg={12} className="payment-second-col">
            <PaymentForm />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Payment;

// import React, { useState, useEffect } from "react";
// import { loadStripe } from "@stripe/stripe-js";

// const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");

// const PaymentForm = () => {
//   const [error, setError] = useState(null);
//   const [stripe, setStripe] = useState(null);
//   const [cardElement, setCardElement] = useState(null);

//   useEffect(() => {
//     stripePromise.then((s) => {
//       setStripe(s);
//     });
//   }, []);

//   useEffect(() => {
//     if (!stripe) {
//       return;
//     }

//     const elements = stripe.elements();
//     const newCardElement = elements.create("card");
//     setCardElement(newCardElement);
//     newCardElement.mount("#card-element");
//   }, [stripe]);

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !cardElement) {
//       return;
//     }

//     const { error, paymentMethod } = await stripe.createPaymentMethod({
//       type: "card",
//       card: cardElement,
//     });

//     if (error) {
//       setError(error.message);
//     } else {
//       // Send the payment method to your server
//       console.log(paymentMethod);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div className="form-group">
//         <label htmlFor="card-element">Credit or debit card</label>
//         <div id="card-element"></div>
//         {error && <p className="error">{error}</p>}
//       </div>
//       <button type="submit">Pay</button>
//     </form>
//   );
// };

// export default PaymentForm;
