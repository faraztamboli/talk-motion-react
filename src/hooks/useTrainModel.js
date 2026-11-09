import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
import {
  setCurrentProgress,
  setIsTrainingComplete,
  setShowProgress,
  setTestAccuracy,
  setTrainingStatus,
  setValidationAccuracy,
} from "../app/features/trainerSlice";

const POLL_INTERVAL_MS = 2000;

/**
 * Training via the async job queue: trainModelAsync enqueues a job that the
 * standalone training worker executes, then we poll getTrainingJobStatus and
 * feed log lines into the same redux state the old push-based flow used.
 * Falls back to the legacy in-process train2 call if the async endpoints are
 * unavailable (older server build).
 */
function useTrainModel() {
  const [token] = useLocalStorage("token");
  const modelId = useSelector((state) => state.model.modelId);
  const dispatch = useDispatch();
  const pollTimerRef = useRef(null);
  const lastSeqRef = useRef(0);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  function handleLogMessage(message, seq) {
    dispatch(setShowProgress(true));
    dispatch(setTrainingStatus(message));
    dispatch(setCurrentProgress(seq));
    const lower = message.toLowerCase();
    if (lower.includes("test") && lower.includes("accuracy")) {
      dispatch(setTestAccuracy(message));
    }
    if (lower.includes("validation") && lower.includes("accuracy")) {
      dispatch(setValidationAccuracy(message));
    }
  }

  function pollJob(jobId) {
    lastSeqRef.current = 0;
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      JS2Py.PythonFunctions.TalkMotionServer.getTrainingJobStatus(
        token,
        jobId,
        lastSeqRef.current,
        function (res) {
          if (!res) return;
          (res.messages || []).forEach((entry) => {
            handleLogMessage(entry.message, entry.seq);
            lastSeqRef.current = Math.max(lastSeqRef.current, entry.seq);
          });
          if (res.status === "complete") {
            stopPolling();
            dispatch(setTrainingStatus("Training Complete!"));
            dispatch(setIsTrainingComplete(true));
          } else if (res.status === "failed") {
            stopPolling();
            dispatch(
              setTrainingStatus(
                "Training failed" + (res.error_message ? `: ${res.error_message}` : "")
              )
            );
            dispatch(setIsTrainingComplete(true));
          }
        }
      );
    }, POLL_INTERVAL_MS);
  }

  function trainLegacy() {
    // old in-process path; progress arrives via the jsOnUpdateTrainingStatus
    // callback registered in App.jsx
    JS2Py.PythonFunctions.TalkMotionServer.train2(token, modelId, function (res) {
      console.log(res);
    });
  }

  function train() {
    try {
      const enqueue = JS2Py.PythonFunctions.TalkMotionServer.trainModelAsync;
      if (typeof enqueue !== "function") {
        trainLegacy();
        return;
      }
      enqueue(token, modelId, function (res) {
        if (res && res.job_id) {
          dispatch(setShowProgress(true));
          dispatch(
            setTrainingStatus(
              res.already_running
                ? "Training already in progress for this model — attaching to it..."
                : "Training queued..."
            )
          );
          pollJob(res.job_id);
        } else {
          trainLegacy();
        }
      });
    } catch (err) {
      console.log(err);
      trainLegacy();
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
