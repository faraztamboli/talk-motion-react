import JS2Py from "../remotepyjs";
import { useDispatch } from "react-redux";
import {
  setCurrentProgress,
  setIsTrainingComplete,
  setShowProgress,
  setTestAccuracy,
  setTrainingStatus,
  setValidationAccuracy,
} from "../app/features/trainerSlice";

function App() {
  const dispatch = useDispatch();

  JS2Py.registerJSFunctionToBeCalledByPython(
    "jsOnUpdateTrainingStatus",
    jsOnUpdateTrainingStatus
  );

  function jsOnUpdateTrainingStatus(result) {
    console.log(result);
    dispatch(setShowProgress(true));
    dispatch(setTrainingStatus(result?.result));
    dispatch(setCurrentProgress(result?.index));

    if (result.result.includes("Test accuracy")) {
      dispatch(setTestAccuracy(result.result));
    }

    if (result.result.includes("Validation accuracy")) {
      dispatch(setValidationAccuracy(result.result));
    }

    if (result.result === "Training Complete!") {
      dispatch(setIsTrainingComplete(true));
    }
  }
}

export default App;
