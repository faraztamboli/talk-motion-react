/**
 * Models hub data: models, trainers, words/phrases (concepts), samples, training jobs and
 * reference videos. classicApi endpoints over the RemotePy server (see model_service.py).
 *
 * listModels: { scope, search, offset, limit, sort } -> { rows: normalized models, total }
 *   scope "usable"    models you can translate with (owned, trained by you, purchased)
 *         "trainable" models you can record samples for and train (owned, trainer of)
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

const asError = (err, fallback) => ({ error: { code: err?.code || "unknown", message: err?.message || fallback } });

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
    return asError(err, "Could not load models");
  }
}

const modelTag = (id) => ({ type: "Model", id: String(id) });
const conceptListTag = (modelId) => ({ type: "Concept", id: `LIST-${modelId}` });
const samplesTag = (modelId, concept) => ({ type: "Sample", id: `${modelId}:${concept}` });
const jobsTag = (modelId) => ({ type: "TrainingJob", id: `LIST-${modelId}` });

/** Server concept summary -> UI shape. */
export function normalizeConcept(c) {
  return {
    concept: c.concept,
    label: c.display_name || c.concept,
    kind: c.kind || (String(c.concept).includes(" ") ? "phrase" : "word"),
    sampleCount: Number(c.sample_count ?? 0),
    readyCount: Number(c.indexed_count ?? c.sample_count ?? 0),
    processingCount: Number(c.pending_count ?? 0),
    target: Number(c.target_samples ?? 20),
    videoUrl: c.video_url || null,
    declared: Boolean(c.declared),
  };
}

export const modelsApi = classicApi.injectEndpoints({
  endpoints: (build) => ({
    // ---- models
    listModels: build.query({
      queryFn: listModelsQuery,
      providesTags: (result) => [
        { type: "ModelList", id: "LIST" },
        ...(result?.rows || []).map((m) => modelTag(m.id)),
      ],
    }),
    getModel: build.query({
      query: (modelId) => ({ fn: "getModel", args: [modelId] }),
      transformResponse: (res) => normalizeModel(Array.isArray(res) ? res[0] : res),
      providesTags: (result, error, modelId) => [modelTag(modelId)],
    }),
    getModelDetails: build.query({
      query: (modelId) => ({ fn: "getModelDetails", args: [modelId] }),
      transformResponse: (res) => ({
        ...normalizeModel(res),
        permissions: res?.permissions || { use: false, train: false, manage: false },
        labels: res?.labels || [],
        lastJob: res?.last_job || null,
      }),
      providesTags: (result, error, modelId) => [modelTag(modelId), { type: "Trainer", id: String(modelId) }],
    }),
    createModel: build.mutation({
      query: ({ title, description, isPublic }) => ({ fn: "createModel", args: [title, description, Boolean(isPublic)] }),
      invalidatesTags: [{ type: "ModelList", id: "LIST" }],
    }),
    updateModel: build.mutation({
      query: ({ id, title, description, isPublic }) => ({ fn: "updateModel", args: [id, title, description, Boolean(isPublic)] }),
      invalidatesTags: (r, e, { id }) => [modelTag(id), { type: "ModelList", id: "LIST" }],
    }),
    deleteModel: build.mutation({
      query: (id) => ({ fn: "deleteModel", args: [id] }),
      invalidatesTags: (r, e, id) => [modelTag(id), { type: "ModelList", id: "LIST" }],
    }),
    cloneModel: build.mutation({
      query: (id) => ({ fn: "cloneModel", args: [id] }),
      invalidatesTags: [{ type: "ModelList", id: "LIST" }],
    }),
    addTrainer: build.mutation({
      query: ({ modelId, username }) => ({ fn: "addModelTrainer", args: [modelId, username] }),
      invalidatesTags: (r, e, { modelId }) => [{ type: "Trainer", id: String(modelId) }, modelTag(modelId)],
    }),
    removeTrainer: build.mutation({
      query: ({ modelId, username }) => ({ fn: "removeModelTrainer", args: [modelId, username] }),
      invalidatesTags: (r, e, { modelId }) => [{ type: "Trainer", id: String(modelId) }, modelTag(modelId)],
    }),

    // ---- words and phrases
    listConcepts: build.query({
      query: (modelId) => ({ fn: "listConcepts", args: [modelId] }),
      transformResponse: (res) => (Array.isArray(res) ? res.map(normalizeConcept) : []),
      providesTags: (result, error, modelId) => [conceptListTag(modelId)],
    }),
    createConcept: build.mutation({
      query: ({ modelId, text, target }) => ({ fn: "createConcept", args: [modelId, text, target ?? null] }),
      transformResponse: normalizeConcept,
      invalidatesTags: (r, e, { modelId }) => [conceptListTag(modelId), modelTag(modelId)],
    }),
    updateConcept: build.mutation({
      query: ({ modelId, concept, target, label }) => ({ fn: "updateConcept", args: [modelId, concept, target ?? null, label ?? null] }),
      invalidatesTags: (r, e, { modelId }) => [conceptListTag(modelId)],
    }),
    renameConcept: build.mutation({
      query: ({ modelId, concept, newText }) => ({ fn: "renameConcept", args: [modelId, concept, newText], timeoutMs: 120000 }),
      invalidatesTags: (r, e, { modelId }) => [conceptListTag(modelId), modelTag(modelId), { type: "Sample" }],
    }),
    deleteConcept: build.mutation({
      query: ({ modelId, concept }) => ({ fn: "deleteConcept", args: [modelId, concept], timeoutMs: 60000 }),
      invalidatesTags: (r, e, { modelId, concept }) => [conceptListTag(modelId), modelTag(modelId), samplesTag(modelId, concept)],
    }),
    getConceptSamples: build.query({
      query: ({ modelId, concept }) => ({ fn: "getConceptSamples", args: [modelId, concept] }),
      providesTags: (r, e, { modelId, concept }) => [samplesTag(modelId, concept)],
    }),
    getSampleFrames: build.query({
      query: ({ modelId, concept, sampleId }) => ({ fn: "getSampleFrames", args: [modelId, concept, sampleId] }),
      keepUnusedDataFor: 300,
    }),
    deleteSamples: build.mutation({
      query: ({ modelId, concept, sampleIds }) => ({ fn: "deleteSamples", args: [modelId, concept, sampleIds] }),
      invalidatesTags: (r, e, { modelId, concept }) => [samplesTag(modelId, concept), conceptListTag(modelId), modelTag(modelId)],
    }),
    submitSample: build.mutation({
      query: ({ modelId, concept, frames }) => ({ fn: "submitGestureSample", args: [modelId, concept, frames], timeoutMs: 45000 }),
      invalidatesTags: (r, e, { modelId, concept }) => [samplesTag(modelId, concept), conceptListTag(modelId), modelTag(modelId)],
    }),

    deleteCapture: build.mutation({
      query: ({ modelId, concept, captureId }) => ({ fn: "deleteCapture", args: [modelId, concept, captureId] }),
      invalidatesTags: (r, e, { modelId, concept }) => [samplesTag(modelId, concept), conceptListTag(modelId), modelTag(modelId)],
    }),

    // ---- training
    getTrainingReadiness: build.query({
      query: (modelId) => ({ fn: "getTrainingReadiness", args: [modelId] }),
      providesTags: (r, e, modelId) => [conceptListTag(modelId), jobsTag(modelId)],
    }),
    startTraining: build.mutation({
      query: (modelId) => ({ fn: "trainModelAsync", args: [modelId] }),
      invalidatesTags: (r, e, modelId) => [jobsTag(modelId), modelTag(modelId)],
    }),
    cancelTraining: build.mutation({
      query: ({ jobId }) => ({ fn: "cancelTrainingJob", args: [jobId] }),
      invalidatesTags: (r, e, { modelId }) => [jobsTag(modelId), modelTag(modelId)],
    }),
    listTrainingJobs: build.query({
      query: (modelId) => ({ fn: "getModelTrainingJobs", args: [modelId, 10] }),
      providesTags: (r, e, modelId) => [jobsTag(modelId)],
    }),

    // ---- reference videos (per word or phrase)
    setConceptVideoUrl: build.mutation({
      query: ({ modelId, concept, url }) => ({ fn: "setConceptVideoUrl", args: [modelId, concept, url] }),
      invalidatesTags: (r, e, { modelId }) => [conceptListTag(modelId)],
    }),
    removeConceptVideo: build.mutation({
      query: ({ modelId, concept }) => ({ fn: "removeConceptVideo", args: [modelId, concept] }),
      invalidatesTags: (r, e, { modelId }) => [conceptListTag(modelId)],
    }),
  }),
});

export const {
  useListModelsQuery,
  useGetModelQuery,
  useGetModelDetailsQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
  useDeleteModelMutation,
  useCloneModelMutation,
  useAddTrainerMutation,
  useRemoveTrainerMutation,
  useListConceptsQuery,
  useCreateConceptMutation,
  useUpdateConceptMutation,
  useRenameConceptMutation,
  useDeleteConceptMutation,
  useGetConceptSamplesQuery,
  useGetSampleFramesQuery,
  useDeleteSamplesMutation,
  useSubmitSampleMutation,
  useDeleteCaptureMutation,
  useGetTrainingReadinessQuery,
  useStartTrainingMutation,
  useCancelTrainingMutation,
  useListTrainingJobsQuery,
  useSetConceptVideoUrlMutation,
  useRemoveConceptVideoMutation,
} = modelsApi;

export { conceptListTag, samplesTag, jobsTag, modelTag };
