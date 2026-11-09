/**
 * Model queries and mutations (classicApi endpoints).
 *
 * listModels: { scope, search, offset, limit, sort } -> { rows: normalized models, total }
 *   scope "usable"    models you can translate with (owned, trained for you, purchased)
 *         "trainable" models you can collect samples for and train (owned, trainer of)
 *         "mine"      owned + trainer of + purchased, each with your role
 *         "public"    the public catalogue (store)
 * Uses the server's listModels when it has it; older servers fall back to the legacy lists.
 */
import { classicApi } from "../../app/classicApi";
import { hasRpc, rpc, sessionToken, unwrapList } from "../../api/rpc";
import { normalizeModel } from "./normalizeModel";

const LEGACY_LIST = {
  usable: "getModelsUserCanUse",
  trainable: "getModelsUserCanTrain",
  mine: "getUsersModels",
  public: "getPublicModels",
};

async function listModelsQuery({ scope = "mine", search = "", offset = 0, limit = 20, sort = "recent" } = {}) {
  try {
    if (hasRpc("listModels")) {
      const res = await rpc("listModels", [sessionToken(), scope, search, offset, limit, sort]);
      const rows = (res?.rows || []).map(normalizeModel).filter(Boolean);
      return { data: { rows, total: Number(res?.total ?? rows.length) } };
    }
    const res = await rpc(LEGACY_LIST[scope] || LEGACY_LIST.mine, [sessionToken(), search, offset, limit]);
    const { rows, total } = unwrapList(res);
    return { data: { rows: rows.map(normalizeModel).filter(Boolean), total } };
  } catch (err) {
    return { error: { code: err?.code || "unknown", message: err?.message || "Could not load models" } };
  }
}

export const modelsApi = classicApi.injectEndpoints({
  endpoints: (build) => ({
    listModels: build.query({
      queryFn: listModelsQuery,
      providesTags: (result) => [
        { type: "ModelList", id: "LIST" },
        ...(result?.rows || []).map((m) => ({ type: "Model", id: m.id })),
      ],
    }),
    getModel: build.query({
      query: (modelId) => ({ fn: "getModel", args: [modelId] }),
      transformResponse: (res) => normalizeModel(Array.isArray(res) ? res[0] : res),
      providesTags: (result, error, modelId) => [{ type: "Model", id: String(modelId) }],
    }),
  }),
});

export const { useListModelsQuery, useGetModelQuery } = modelsApi;
