import { useCallback, useEffect, useRef, useState } from "react";
import { cuesToSubtitles } from "./cues";
import { uploadForCaptions } from "./uploadCaptions";

/** Error -> { key, fallback } for t(key, fallback); a friendly message per failure mode. */
export function describeCaptionError(err) {
  switch (err?.status) {
    case 401:
      return { key: "captions.error.auth", fallback: "Your session has expired. Sign in again to use auto-captions." };
    case 413:
      return { key: "captions.error.tooBig", fallback: "This file is too large. Auto-captions accept up to 100 MB and 15 minutes." };
    case 415:
      return { key: "captions.error.format", fallback: "We could not read audio from this file. Try an MP3, WAV, MP4 or WebM file." };
    case 422:
      return { key: "captions.error.language", fallback: "That language is not supported for auto-captions yet." };
    case 429:
      return { key: "captions.error.rate", fallback: "You have used all your auto-captions for now. Try again in an hour." };
    case 503:
      return { key: "captions.error.unavailable", fallback: "Auto-captions are not available right now. Please try again in a few minutes." };
    case 0:
      return { key: "captions.error.network", fallback: "We could not reach the server. Check your connection and try again." };
    default:
      return { key: "captions.error.generic", fallback: "Something went wrong while creating captions. Please try again." };
  }
}

/**
 * Upload a media file, then hold the returned cues as editable subtitle rows.
 * status: idle | uploading | transcribing | done | error
 */
export default function useAutoCaptions({ upload = uploadForCaptions } = {}) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0); // upload fraction, 0..1
  const [error, setError] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (file, { language = "en" } = {}) => {
      if (!file) return null;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("uploading");
      setProgress(0);
      setError(null);
      try {
        const result = await upload(file, {
          language,
          signal: controller.signal,
          onUploadProgress: (fraction) => {
            if (controller.signal.aborted) return;
            setProgress(fraction);
            if (fraction >= 1) setStatus("transcribing");
          },
        });
        if (controller.signal.aborted) return null;
        const rows = cuesToSubtitles(result?.cues);
        setSubtitles(rows);
        setStatus("done");
        return rows;
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") {
          setStatus("idle");
          return null;
        }
        setError(describeCaptionError(err));
        setStatus("error");
        return null;
      }
    },
    [upload]
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const updateSubtitle = useCallback((id, patch) => {
    setSubtitles((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeSubtitle = useCallback((id) => {
    setSubtitles((rows) => rows.filter((r) => r.id !== id));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setProgress(0);
    setError(null);
    setSubtitles([]);
  }, []);

  return { status, progress, error, subtitles, run, cancel, updateSubtitle, removeSubtitle, reset };
}
