/**
 * Data layer for the classic (RemotePy) features, on RTK Query.
 *
 * Each area injects its endpoints from its own module (features/models/modelsApi.js, ...):
 *
 *   classicApi.injectEndpoints({ endpoints: (build) => ({
 *     getModel: build.query({ query: (id) => ({ fn: "getModel", args: [id] }), providesTags: ... }),
 *   }) });
 *
 * A query is { fn, args, withToken = true, raw, timeoutMs }: the session token is prepended
 * to args unless withToken is false. Errors come back as { code, message } (see rpc.js), so
 * pages can show rpcErrorMessage(error). Mutations invalidate tags, so lists refresh after a
 * create, update or delete without any manual refetch; every active query refetches after a
 * reconnect, and the cache is dropped on sign-out.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { rpc, sessionToken } from "../api/rpc";

export const TAG_TYPES = [
  "Model",
  "ModelList",
  "Concept",
  "Sample",
  "ConceptVideo",
  "TrainingJob",
  "Recording",
  "RecordingList",
  "Captions",
  "Cart",
  "Purchase",
  "Trainer",
];

export async function rpcBaseQuery({ fn, args = [], withToken = true, raw = false, timeoutMs }) {
  try {
    const data = await rpc(fn, withToken ? [sessionToken(), ...args] : args, { raw, timeoutMs });
    return { data };
  } catch (err) {
    return {
      error: {
        code: err?.code || "unknown",
        message: err?.message || "Request failed",
        funcName: err?.funcName,
      },
    };
  }
}

export const classicApi = createApi({
  reducerPath: "classicApi",
  baseQuery: rpcBaseQuery,
  tagTypes: TAG_TYPES,
  keepUnusedDataFor: 120,
  endpoints: () => ({}),
});

/** Refetch everything on screen (after a reconnect). */
export const invalidateAllClassic = () => classicApi.util.invalidateTags(TAG_TYPES);
