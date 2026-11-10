import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { rpc, sessionToken } from "../../../api/rpc";
import { classicApi } from "../../../app/classicApi";
import { isTerminal } from "./trainingProgress";
import { jobsTag, modelTag } from "../modelsApi";

const POLL_MS = 2000;
const MAX_POLL_MS = 15000;

/**
 * Follow a training job: polls getTrainingJobStatus, accumulating log lines (by seq), with one
 * request in flight at a time, backoff on errors, and a stop at complete / failed / cancelled.
 * When the job ends, the model and its job list are refetched.
 *
 * Returns { job, messages, error, polling }. job: { job_id, status, error_message, metrics }.
 */
export default function useTrainingJob(modelId, jobId) {
  const dispatch = useDispatch();
  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const seqRef = useRef(0);
  const timerRef = useRef(null);
  const inFlight = useRef(false);
  const delayRef = useRef(POLL_MS);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    seqRef.current = 0;
    setJob(null);
    setMessages([]);
    setError(null);
    delayRef.current = POLL_MS;
  }, []);

  useEffect(() => {
    reset();
    if (!jobId) return undefined;
    let cancelled = false;
    setPolling(true);

    const poll = async () => {
      if (cancelled || inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await rpc("getTrainingJobStatus", [sessionToken(), jobId, seqRef.current]);
        if (cancelled) return;
        const fresh = (res?.messages || []).filter((m) => m.seq > seqRef.current);
        if (fresh.length) {
          seqRef.current = fresh[fresh.length - 1].seq;
          setMessages((list) => [...list, ...fresh]);
        }
        setJob(res);
        setError(null);
        delayRef.current = POLL_MS;
        if (isTerminal(res?.status)) {
          setPolling(false);
          dispatch(classicApi.util.invalidateTags([modelTag(modelId), jobsTag(modelId), { type: "ModelList", id: "LIST" }]));
          return;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err);
        delayRef.current = Math.min(delayRef.current * 2, MAX_POLL_MS);
      } finally {
        inFlight.current = false;
      }
      if (!cancelled) timerRef.current = setTimeout(poll, delayRef.current);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      setPolling(false);
    };
  }, [jobId, modelId, dispatch, reset]);

  return { job, messages, error, polling };
}
