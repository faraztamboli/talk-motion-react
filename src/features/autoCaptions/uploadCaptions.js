import { API_BASE, ApiError, getAccessToken, refreshTokens } from "../../api/http";

const UPLOAD_TIMEOUT_MS = 20 * 60 * 1000; // a 15 minute file is recognised at ~1.5x real time

function send(file, { language, token, onUploadProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const query = language ? `?language=${encodeURIComponent(language)}` : "";
    xhr.open("POST", `${API_BASE}/captions/transcribe${query}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onUploadProgress?.(e.loaded / e.total);
    };
    xhr.upload.onload = () => onUploadProgress?.(1);
    xhr.onerror = () => reject(new ApiError(0, { detail: "network_error" }));
    xhr.ontimeout = () => reject(new ApiError(0, { detail: "timeout" }));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.onload = () => {
      let data = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = { detail: xhr.responseText };
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, data));
    };
    signal?.addEventListener("abort", () => xhr.abort());
    const form = new FormData();
    form.append("file", file, file.name || "audio");
    xhr.send(form);
  });
}

/** POST the media to /captions/transcribe with upload progress; refreshes the session once on 401. */
export async function uploadForCaptions(file, options = {}) {
  try {
    return await send(file, { ...options, token: getAccessToken() });
  } catch (err) {
    if (err?.status !== 401) throw err;
    const token = await refreshTokens();
    return send(file, { ...options, token });
  }
}
