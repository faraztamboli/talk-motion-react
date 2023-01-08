import { useSelector } from "react-redux";
import JS2Py from "../remotepyjs";

function useTrainModel() {
  const modelId = useSelector((state) => state.model.modelId);

  function train() {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.train(modelId, function (res) {
        console.log(res);
      });
    } catch (err) {
      console.log(err);
    }
  }

  return { train };
}

export default useTrainModel;
