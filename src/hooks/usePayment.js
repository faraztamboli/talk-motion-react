import { useDispatch } from "react-redux";
import { setCartCount } from "../app/features/cartSlice";
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
            console.log(res);
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
        JS2Py.PythonFunctions.TalkMotionServer.getCart(token, function (res) {
          console.log(res);
          const cart_quantity = Object.keys(res)?.length;
          // set the cart quantity to show on header
          dispatch(setCartCount(cart_quantity));
          resolve(res);
        });
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
            console.log(res);
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