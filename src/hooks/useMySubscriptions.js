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

  return {
    getPurchaseList,
    getPurchaseDetail,
  };
}

export default useMySubscriptions;
