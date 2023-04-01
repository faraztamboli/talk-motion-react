import { useSelector } from "react-redux";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useTrainModel() {
  const [token] = useLocalStorage("token");
  const modelId = useSelector((state) => state.model.modelId);

  function train() {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.train2(token,modelId, function (res) {
        console.log(res);
      });
    } catch (err) {
      console.log(err);
    }
  }

  function getTotalNumberOfLogMessages() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getTotalNumberOfLogMessages(
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

  return { train, getTotalNumberOfLogMessages };
}

export default useTrainModel;
