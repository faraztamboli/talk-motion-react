import JS2Py from "../remotepyjs";
import useBase64String from "./useBase64String";
import useLocalStorage from "./useLocalStorage";

function useMySubscriptions() {
  const [token] = useLocalStorage("token");
  const { getBase64 } = useBase64String();

  function getPurchaseDetail(invoice_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPurchaseList(
          token,
          invoice_id,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getPurchaseList(username) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPurchaseList(
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

  function cancelSubscription(subscription_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.cancelSubscription(
          token,
          subscription_id,
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
  function cancelProductSubscription(product_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.cancelProductSubscription(
          token,
          product_id,
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
  function cancelSubscriptionItem(subscription_item_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.cancelSubscriptionItem(
          token,
          subscription_item_id,
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

  return {
    getPurchaseList,
    getPurchaseDetail,
    cancelSubscription,
    cancelSubscriptionItem,
    cancelProductSubscription,
  };
}

export default useMySubscriptions;
