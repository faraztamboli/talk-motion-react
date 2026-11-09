/**
 * Recording, segment and caption data for the Subtitle Designer, viewer and libraries
 * (classicApi endpoints). New server functions are used when the server has them; older
 * servers fall back to the legacy ones where a fallback makes sense.
 */
import { classicApi } from "../../app/classicApi";
import { hasRpc, rpc, RpcError, sessionToken } from "../../api/rpc";
import { createVideoRecording, getVideoRecording, updateVideoRecording } from "../../api/talkmotionRecordings";
import { parseYouTubeVideoId, watchUrlForVideoId } from "../../utils/youtubeUrl";
import { normalizeCaptionTrack, normalizeDetails, normalizeLegacyDetails, normalizeRecordingList } from "./normalizeRecording";
import { toServerCues } from "./captions/cueFormats";

const asError = (err, fallback = "Request failed") => ({
  error: { code: err?.code || "unknown", message: err?.message || fallback },
});

const LEGACY_LIST = { public: "getPublicVideoRecordings", shared: "getVideoRecordingsICanUse", mine: "getVideoRecordingsICanUse" };

async function listRecordings({ scope = "mine", search = "", page = 1, pageSize = 24 }, api) {
  const offset = Math.max(0, (page - 1) * pageSize);
  try {
    if (hasRpc("listVideoRecordings")) {
      const res = await rpc("listVideoRecordings", [sessionToken(), scope, search, offset, pageSize]);
      return { data: normalizeRecordingList(res) };
    }
    const res = await rpc(LEGACY_LIST[scope] || LEGACY_LIST.mine, [sessionToken(), search, offset, pageSize], { raw: true });
    const list = normalizeRecordingList(res);
    if (scope !== "public") {
      const me = api.getState()?.user?.username;
      const rows = list.rows.filter((r) => (scope === "mine" ? r.owner === me : r.owner !== me));
      return { data: { rows, total: rows.length < list.rows.length ? rows.length : list.total } };
    }
    return { data: list };
  } catch (err) {
    return asError(err, "Couldn't load recordings");
  }
}

async function getDetails(recordingId, api) {
  try {
    if (hasRpc("getVideoRecordingDetails")) {
      const res = await rpc("getVideoRecordingDetails", [sessionToken(), Number(recordingId)], { raw: true });
      if (!res || res.ok === false) {
        return {
          error: {
            code: res?.code || "not_found",
            message: res?.error || "This recording does not exist or is not shared with you.",
          },
        };
      }
      return { data: normalizeDetails(res) };
    }
    const res = await getVideoRecording(sessionToken(), recordingId);
    const details = normalizeLegacyDetails(res, api.getState()?.user?.username);
    if (!details) return { error: { code: "not_found", message: "This recording does not exist or is not shared with you." } };
    return { data: details };
  } catch (err) {
    return asError(err, "Couldn't load the recording");
  }
}

/**
 * { ok, videoId, title, author, thumbnailUrl, exists, embeddable, reason } for a YouTube URL.
 * embeddable/exists are null when the server can't check (older servers).
 */
async function youTubeMetadata(urlOrId) {
  const videoId = parseYouTubeVideoId(urlOrId || "");
  if (!videoId) return { error: { code: "invalid", message: "That isn't a YouTube video link." } };
  const unknown = {
    ok: true,
    videoId,
    watchUrl: watchUrlForVideoId(videoId),
    title: null,
    author: null,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    exists: null,
    embeddable: null,
  };
  if (!hasRpc("getYouTubeMetadata")) return { data: unknown };
  try {
    const res = await rpc("getYouTubeMetadata", [sessionToken(), videoId], { raw: true });
    if (!res || res.ok === false) {
      if (res?.code === "unreachable") return { data: unknown }; // let the player decide
      return { error: { code: res?.code || "invalid", message: res?.error || "That video can't be used." } };
    }
    return {
      data: {
        ok: true,
        videoId: res.video_id || videoId,
        watchUrl: res.watch_url || unknown.watchUrl,
        title: res.title || null,
        author: res.author || null,
        thumbnailUrl: res.thumbnail_url || unknown.thumbnailUrl,
        exists: res.exists,
        embeddable: res.embeddable,
        reason: res.reason || null,
      },
    };
  } catch (err) {
    if (err?.code === "timeout" || err?.code === "disconnected") return { data: unknown };
    return asError(err, "Couldn't check that video");
  }
}

async function createRecording({ title, description, videoId, youtubeTitle, youtubeAuthor, duration }) {
  try {
    const created = await createVideoRecording(sessionToken(), title || "", description || "", watchUrlForVideoId(videoId));
    const id = created?.video_recording_id;
    if (!id) throw new RpcError("bad_response", "The server didn't return the new recording's id");
    if (youtubeTitle || youtubeAuthor || duration) {
      // Metadata is best-effort: the recording exists even if this fails.
      await updateVideoRecording(sessionToken(), id, youtubeTitle || null, youtubeAuthor || null, null, duration || null).catch(
        () => {}
      );
    }
    return { data: { id: String(id) } };
  } catch (err) {
    return asError(err, "Couldn't create the recording");
  }
}

async function setDetails({ id, title, description }) {
  try {
    if (hasRpc("setVideoRecordingDetails")) {
      const res = await rpc("setVideoRecordingDetails", [sessionToken(), Number(id), title ?? null, description ?? null]);
      return { data: { title: res.title, description: res.description } };
    }
    // Older servers can't store the author's title separately; keep it as the video title.
    if (title) await updateVideoRecording(sessionToken(), Number(id), title);
    return { data: { title, description } };
  } catch (err) {
    return asError(err, "Couldn't save the details");
  }
}

const recordingTags = (id) => [
  { type: "Recording", id: String(id) },
  { type: "Captions", id: String(id) },
];

export const recordingsApi = classicApi.injectEndpoints({
  endpoints: (build) => ({
    listRecordings: build.query({
      queryFn: listRecordings,
      providesTags: (result) => [
        { type: "RecordingList", id: "LIST" },
        ...(result?.rows || []).map((r) => ({ type: "Recording", id: r.id })),
      ],
    }),
    getRecordingDetails: build.query({
      queryFn: getDetails,
      providesTags: (result, error, id) => recordingTags(id),
    }),
    getYouTubeMetadata: build.query({
      queryFn: youTubeMetadata,
      keepUnusedDataFor: 3600,
    }),
    createRecording: build.mutation({
      queryFn: createRecording,
      invalidatesTags: [{ type: "RecordingList", id: "LIST" }],
    }),
    setRecordingDetails: build.mutation({
      queryFn: setDetails,
      invalidatesTags: (result, error, { id }) => [{ type: "Recording", id: String(id) }, { type: "RecordingList", id: "LIST" }],
    }),
    setRecordingPrivacy: build.mutation({
      query: ({ id, isPublic }) => ({ fn: "updateVideoRecordingPrivacy", args: [Number(id), Boolean(isPublic)] }),
      invalidatesTags: (result, error, { id }) => [{ type: "Recording", id: String(id) }, { type: "RecordingList", id: "LIST" }],
    }),
    deleteRecording: build.mutation({
      query: (id) => ({ fn: "deleteVideoRecording", args: [Number(id)] }),
      invalidatesTags: (result, error, id) => [{ type: "Recording", id: String(id) }, { type: "RecordingList", id: "LIST" }],
    }),
    deleteShot: build.mutation({
      query: ({ shotId }) => ({ fn: "deleteVideoRecordingShot", args: [Number(shotId)] }),
      invalidatesTags: (result, error, { recordingId }) => [{ type: "Recording", id: String(recordingId) }],
    }),
    saveCaptions: build.mutation({
      query: ({ recordingId, language, label, cues }) => ({
        fn: "saveRecordingCaptions",
        args: [Number(recordingId), language, label || null, toServerCues(cues)],
      }),
      transformResponse: (res) => ({ track: normalizeCaptionTrack(res?.track), adjusted: Number(res?.adjusted || 0) }),
      invalidatesTags: (result, error, { recordingId }) => [{ type: "Captions", id: String(recordingId) }, { type: "Recording", id: String(recordingId) }],
    }),
    deleteCaptions: build.mutation({
      query: ({ recordingId, language }) => ({ fn: "deleteRecordingCaptions", args: [Number(recordingId), language] }),
      invalidatesTags: (result, error, { recordingId }) => [{ type: "Captions", id: String(recordingId) }, { type: "Recording", id: String(recordingId) }],
    }),
  }),
});

export const {
  useListRecordingsQuery,
  useGetRecordingDetailsQuery,
  useGetYouTubeMetadataQuery,
  useLazyGetYouTubeMetadataQuery,
  useCreateRecordingMutation,
  useSetRecordingDetailsMutation,
  useSetRecordingPrivacyMutation,
  useDeleteRecordingMutation,
  useDeleteShotMutation,
  useSaveCaptionsMutation,
  useDeleteCaptionsMutation,
} = recordingsApi;

/** Whether the connected server can store text captions. */
export const serverSupportsCaptions = () => hasRpc("saveRecordingCaptions");
