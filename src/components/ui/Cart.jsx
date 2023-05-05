import { Button, Skeleton } from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useModels from "../../hooks/useModels";
import usePayment from "../../hooks/usePayment";
import modelImg from "../../media/images/plurk.png";

function Cart() {
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [ids, setIds] = useState([]);
  const { getCart, purchaseCart } = usePayment();
  const { addOrRemoveCartProduct } = useModels();

  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then((res) => {
        console.log(res);
        setIds(Object.keys(res));
        setCart(Object.values(res));
        console.log(cart);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  function handlePurchaseCart() {
    setBtnLoading(true);
    purchaseCart()
      .then((res) => {
        console.log(res);
        setBtnLoading(false);
        navigate("/payment");
      })
      .catch((err) => {
        console.log(err);
        setBtnLoading(false);
      });
  }

  return (
    <div className="container flex flex-center-center">
      <div className="w-90p mt-3">
        <div className="flex flex-between-center mb-10">
          <h2>Your Cart</h2>
          <div className="total flex flex-center-center">
            <h3 className="mr-4">Sub-total:</h3>
            <p>$299.97</p>
          </div>
          {/* <Button
            type="primary"
            className="converter-btns"
            onClick={handlePurchaseCart}
            loading={btnLoading}
          >
            Checkout
          </Button> */}
        </div>
        {!loading &&
          cart.length > 0 &&
          cart.map((elem, index) => (
            <div className="purchase-model-list-item" key={index}>
              <div className="purchase-model-list-item-content">
                <div className="model-logo">
                  <img src={modelImg} alt="model" />
                </div>
                <div>
                  <h3>{elem?.product?.name}</h3>
                  <p>{elem?.product?.description}</p>
                </div>
              </div>
              <div className="purchase-model-list-item-price">
                <p>${elem.price_detail?.unit_amount}</p>
              </div>
              <div>
                <Button
                  onClick={() => {
                    addOrRemoveCartProduct(ids[index], -1)
                      .then((res) => console.log(res))
                      .catch((err) => console.log(err));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

        {loading && <Skeleton active />}
      </div>
    </div>
  );
}

export default Cart;
