import { useEffect } from "react";
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

/**
 * Legacy synchronous training (train2) pushes progress lines to the browser through
 * jsOnUpdateTrainingStatus. Registered once; the async job API polls instead.
 */
export default function useTrainingStatusPush() {
  const dispatch = useDispatch();
  useEffect(() => {
    JS2Py.registerJSFunctionToBeCalledByPython("jsOnUpdateTrainingStatus", (result) => {
      const line = typeof result?.result === "string" ? result.result : "";
      dispatch(setShowProgress(true));
      if (line) dispatch(setTrainingStatus(line));
      if (Number.isFinite(result?.index)) dispatch(setCurrentProgress(result.index));
      if (line.includes("Test accuracy")) dispatch(setTestAccuracy(line));
      if (line.includes("Validation accuracy")) dispatch(setValidationAccuracy(line));
      if (line === "Training Complete!") dispatch(setIsTrainingComplete(true));
    });
  }, [dispatch]);
}
