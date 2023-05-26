import { useDispatch } from "react-redux";
import {
  setCartCount,
  setCartProducts,
  setCartIds,
} from "../app/features/cartSlice";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function usePayment() {
  const [token] = useLocalStorage("token");
  const dispatch = useDispatch();

  function getSupportedCurrencies() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getSupportedPaymentCurrencies(
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getCart() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getCart(
          token,
          function (res) {
            let cart = [];
            if (typeof res === "object") {
              cart = res[0];
              let cart_total = res[1];
              console.log(cart);
              console.log(cart_total);
              const cart_quantity = Object.keys(cart)?.length;
              // set the cart quantity to show on header
              dispatch(setCartProducts(Object.values(cart)));
              dispatch(setCartIds(Object.keys(cart)));
              dispatch(setCartCount(cart_quantity));
            } else {
              dispatch(setCartIds([]));
              dispatch(setCartProducts([]));
              dispatch(setCartCount(0));
            }
            resolve(cart);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function purchaseCart() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.purchaseCart(
          token,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  return { getSupportedCurrencies, getCart, purchaseCart };
}

export default usePayment;
