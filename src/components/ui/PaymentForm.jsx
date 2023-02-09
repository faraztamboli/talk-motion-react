import React, { useState, useEffect } from "react";
import { Col, Form, Row, Input, Button } from "antd";
import { MdCode, MdCreditCard, MdLock } from "react-icons/md";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");

function PaymentForm() {
  const [error, setError] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardElement, setCardElement] = useState(null);

  useEffect(() => {
    stripePromise.then((s) => {
      setStripe(s);
    });
  }, []);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const elements = stripe.elements();
    const newCardElement = elements.create("card");
    setCardElement(newCardElement);
    newCardElement.mount("#card-element");
  }, [stripe]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !cardElement) {
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message);
    } else {
      // Send the payment method to your server
      console.log(paymentMethod);
    }

    const nameInput = document.getElementById("name");

    // Create payment method and confirm payment intent.
    let clientSecret = "lsdfjk";
    stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: nameInput.value,
          },
        },
      })
      .then((result) => {
        if (result.error) {
          alert(result.error.message);
        } else {
          // Successful subscription payment
        }
      });
  };

  return (
    // <div className="payment-container">
    //   <div className="payment-details">
    //     <Form id="payment-form">
    //       <h2>Check-out</h2>
    //       <p>Payee Details</p>
    //       <Row className="payment-form-row">
    //         <Col span={11} xs={24} md={11}>
    //           <Form.Item>
    //             <Input
    //               className="payment-form-inputs"
    //               type="text"
    //               size="large"
    //               placeholder="First Name"
    //             />
    //           </Form.Item>
    //         </Col>
    //         <Col span={11} xs={24} md={11}>
    //           <Form.Item>
    //             <Input
    //               className="payment-form-inputs"
    //               type="text"
    //               size="large"
    //               placeholder="Last Name"
    //             />
    //           </Form.Item>
    //         </Col>
    //       </Row>

    //       <p>Payment Details</p>
    //       <Form.Item>
    //         <Input
    //           className="payment-form-inputs"
    //           type="text"
    //           size="large"
    //           placeholder="Card Number"
    //           prefix={<MdCreditCard size={24} className="payment-form-icons" />}
    //         />
    //       </Form.Item>

    //       <Form.Item>
    //         <Input
    //           className="payment-form-inputs"
    //           type="text"
    //           size="large"
    //           placeholder="zip code"
    //           prefix={<MdCode size={24} className="payment-form-icons" />}
    //         />
    //       </Form.Item>

    //       <Row className="payment-form-row">
    //         <Col span={11} xs={24} md={11}>
    //           <Form.Item>
    //             <Input
    //               className="payment-form-inputs"
    //               type="text"
    //               size="large"
    //               placeholder="CVV"
    //               prefix={<MdLock size={24} className="payment-form-icons" />}
    //             />
    //           </Form.Item>
    //         </Col>
    //         <Col span={11} xs={24} md={11}>
    //           <Form.Item>
    //             <Input
    //               className="payment-form-inputs"
    //               type="text"
    //               size="large"
    //               placeholder="Expire Date"
    //             />
    //           </Form.Item>
    //         </Col>
    //       </Row>
    //       <Button
    //         type="primary"
    //         block
    //         size="large"
    //         className="payment-form-btn"
    //       >
    //         Pay $299.97
    //       </Button>
    //     </Form>
    //   </div>
    // </div>

    <form id="payment-form" onSubmit={handleSubmit}>
      <div id="card-element">
        {/* <!-- Elements will create input elements here --> */}
      </div>

      {/* <!-- We'll put the error messages in this element --> */}
      <div id="card-element-errors" role="alert"></div>
      <button type="submit">Subscribe</button>
    </form>
  );
}

export default PaymentForm;
