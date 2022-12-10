import React from "react";
import modelImg from "../media/images/model.png";

function Cart() {
  return (
    <div className="payment-container">
      <h2>Your Cart</h2>
      <div className="purchase-model-list-item">
        <div className="purchase-model-list-item-content">
          <div className="model-logo">
            <img src={modelImg} alt="model" />
          </div>
          <div>
            <h3>Model 1 Title</h3>
            <p>lorem ipsum dolor sit amet</p>
          </div>
        </div>
        <div className="purchase-model-list-item-price">
          <p>$99.99</p>
        </div>
      </div>

      <div className="purchase-model-list-item">
        <div className="purchase-model-list-item-content">
          <div className="model-logo">
            <img src={modelImg} alt="model" />
          </div>
          <div>
            <h3>Model 1 Title</h3>
            <p>lorem ipsum dolor sit amet</p>
          </div>
        </div>
        <div className="purchase-model-list-item-price">
          <p>$99.99</p>
        </div>
      </div>

      <div className="purchase-model-list-item">
        <div className="purchase-model-list-item-content">
          <div className="model-logo">
            <img src={modelImg} alt="model" />
          </div>
          <div>
            <h3>Model 1 Title</h3>
            <p>lorem ipsum dolor sit amet</p>
          </div>
        </div>
        <div className="purchase-model-list-item-price">
          <p>$99.99</p>
        </div>
      </div>

      <div className="total">
        <h2>Sub-total:</h2>
        <p>$299.97</p>
      </div>
    </div>
  );
}

export default Cart;
