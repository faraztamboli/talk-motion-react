import { Button, Skeleton } from "antd";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useModels from "../../hooks/useModels";
import usePayment from "../../hooks/usePayment";
import modelImg from "../../media/images/plurk.png";
import useMessageApi from "../../hooks/useMessageApi";

function Cart() {
  const { contextHolder, showMessage } = useMessageApi();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(null);
  const { getCart } = usePayment();
  const { addOrRemoveCartProduct } = useModels();
  let cart = useSelector((state) => state.cart.cartProducts);
  let ids = useSelector((state) => state.cart.cartIds);

  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then((res) => {
        // setIds(Object.keys(res));
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setTotal(
      cart.reduce((total, prod) => {
        return prod.price_detail?.unit_amount + total;
      }, 0) / 100
    );
  }, [cart]);

  useEffect(() => {
    total < 0.1 && total != null ? navigate("/models") : "";
  }, [total]);

  const handleRemoveProduct = (id) => {
    addOrRemoveCartProduct(id, -1)
      .then((res) =>
        showMessage("success", "Product removed successfully!")
      )
      .catch((err) =>
        showMessage("error", "Something bad happened!")
      );
  };

  return (
    <div className="container flex flex-center-center">
      {contextHolder}
      <div className="w-90p mt-3">
        <div className="flex flex-between-center mb-10">
          <h2>Your Cart</h2>
          <div className="total flex flex-center-center">
            <h3 className="mr-4">Sub-total:</h3>
            <p>${total != null ? total : 0}</p>
          </div>
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
                <p>${elem.price_detail?.unit_amount / 100}</p>
              </div>
              <div>
                <Button
                  onClick={() => handleRemoveProduct(ids[index])}
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
