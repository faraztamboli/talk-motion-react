import { Button } from "antd";
import React, { useState, useEffect } from "react";
import usePayment from "../../hooks/usePayment";
import modelImg from "../../media/images/plurk.png";

function Cart(props) {
  const [cart, setCart] = useState([]);
  const [ids, setIds] = useState([]);
  const { purchaseCart } = usePayment();
  const { getCart, setCartProductQuantity } = props;

  useEffect(() => {
    getCart()
      .then((res) => {
        setIds(Object.keys(res));
        setCart(Object.values(res));
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="payment-container">
      <h2>Your Cart</h2>
      {cart.length > 0 &&
        cart.map((elem, index) => (
          <div className="purchase-model-list-item" key={index}>
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
              <p>${elem.price_detail.unit_amount}</p>
            </div>
            <div>
              <Button
                onClick={() => {
                  setCartProductQuantity(ids[index], -1)
                    .then((res) => console.log(res))
                    .catch((err) => console.log(err));
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

      <div className="total">
        <h2>Sub-total:</h2>
        <p>$299.97</p>
      </div>

      <div>
        <Button onClick={() => purchaseCart()}>Purchase Cart</Button>
      </div>
    </div>
  );
}

export default Cart;
