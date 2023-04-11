import JS2Py from "../remotepyjs";
import { useDispatch } from "react-redux";
import {
  setTrainingStatusOff,
  setTrainingStatusOn,
} from "../app/features/trainerSlice";
import { setIsSpeaking, setSpeakText } from "../app/features/speechSlice";
import {
  setIsModelLoading,
  setIsRecording,
} from "../app/features/converterSlice";

function App() {
  const dispatch = useDispatch();

  JS2Py.registerJSFunctionToBeCalledByPython(
    "jsOnSignPrediction",
    jsOnSignPrediction
  );

  function jsOnSignPrediction(result) {
    console.log('.....');
    console.log(result);
    console.log('=====');
    dispatch(setIsSpeaking(true));
    dispatch(setSpeakText(result.prediction));
//    dispatch(setShowProgress(true));
//    dispatch(setTrainingStatus(result?.result));
//    //dispatch(setCurrentProgress(result?.index));
//
//    if (result.result.includes("Test accuracy")) {
//      dispatch(setTestAccuracy(result.result));
//    }
//
//    if (result.result.includes("Validation accuracy")) {
//      dispatch(setValidationAccuracy(result.result));
//    }
//
//    if (result.result === "Training Complete!") {
//      dispatch(setIsTrainingComplete(true));
//    }
  }
}

export default App;
