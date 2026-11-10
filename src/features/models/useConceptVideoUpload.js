import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { rpc, sessionToken } from "../../api/rpc";
import { classicApi } from "../../app/classicApi";
import { conceptListTag } from "./modelsApi";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** Blob slice -> raw base64 (no data: prefix). */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read the file"));
    reader.onload = () => {
      const s = String(reader.result || "");
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a reference video for a word or phrase in chunks, with progress and cancel.
 * status: idle | uploading | processing | done | error
 */
export default function useConceptVideoUpload(modelId) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const cancelRef = useRef(null);

  const upload = useCallback(
    async (concept, file) => {
      setError(null);
      if (!file) return null;
      if (!String(file.type || "").startsWith("video/")) {
        setError({ code: "bad_type", message: "Choose a video file (MP4, WebM or MOV)." });
        setStatus("error");
        return null;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        setError({ code: "too_big", message: "Videos can be up to 100 MB." });
        setStatus("error");
        return null;
      }
      const token = sessionToken();
      let cancelled = false;
      let uploadId = null;
      cancelRef.current = () => {
        cancelled = true;
      };
      setStatus("uploading");
      setProgress(0);
      try {
        const init = await rpc("initConceptVideoUpload", [token, modelId, concept, file.type, file.size]);
        uploadId = init.upload_id;
        const chunkSize = init.chunk_size || 1024 * 1024;
        let offset = 0;
        while (offset < file.size) {
          if (cancelled) throw Object.assign(new Error("cancelled"), { code: "cancelled" });
          const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
          const b64 = await blobToBase64(slice);
          let attempt = 0;
          for (;;) {
            try {
              const res = await rpc("uploadConceptVideoChunk", [token, uploadId, offset, b64]);
              offset = res.received_bytes;
              break;
            } catch (err) {
              attempt += 1;
              const expected = /Expected offset (\d+)/.exec(err?.message || "");
              if (expected) {
                offset = Number(expected[1]);
                break;
              }
              if (attempt >= 3 || err?.code === "not_available") throw err;
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
          setProgress(offset / file.size);
        }
        setStatus("processing");
        const done = await rpc("finalizeConceptVideoUpload", [token, uploadId]);
        dispatch(classicApi.util.invalidateTags([conceptListTag(modelId)]));
        setStatus("done");
        return done;
      } catch (err) {
        if (uploadId) rpc("abortConceptVideoUpload", [token, uploadId]).catch(() => {});
        if (err?.code === "cancelled") {
          setStatus("idle");
          return null;
        }
        setError(err);
        setStatus("error");
        return null;
      } finally {
        cancelRef.current = null;
      }
    },
    [dispatch, modelId]
  );

  const cancel = useCallback(() => cancelRef.current?.(), []);
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { upload, cancel, reset, status, progress, error };
}
