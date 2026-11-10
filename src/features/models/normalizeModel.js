/**
 * One shape for a model row, whichever server function produced it.
 *
 * listModels (new) already returns this shape. The legacy lists (getModelsUserCanUse,
 * getModelsUserCanTrain, getUsersModels, getPublicModels) return raw `model` rows with a
 * `badge` of owned | purchased | trainable and `price` in cents.
 */
const BADGE_ROLE = { owned: "owner", purchased: "purchaser", trainable: "trainer" };

function parseRecurring(recurring) {
  if (!recurring) return null;
  if (typeof recurring === "object") return recurring;
  try {
    return JSON.parse(recurring);
  } catch {
    return null;
  }
}

export function normalizeModel(row) {
  if (!row || typeof row !== "object") return null;
  const id = row.id ?? row.model_id;
  if (id === undefined || id === null) return null;
  const role = row.role || BADGE_ROLE[row.badge] || (row.badge ? row.badge : null);
  const toBool = (v) => (v === undefined || v === null ? null : v === true || v === 1 || v === "1" || v === "true");
  return {
    id: String(id),
    title: row.title || `Model ${id}`,
    description: row.description || "",
    isPublic: toBool(row.is_public) ?? false,
    owner: row.create_user || null,
    createdAt: row.create_time || null,
    role, // owner | trainer | purchaser | null (public, not yours)
    trainers: Array.isArray(row.trainers) ? row.trainers : [],
    trained: toBool(row.trained), // null = unknown (legacy servers)
    trainedAt: row.trained_at || null,
    lastJobStatus: row.last_job_status || null,
    conceptCount: Number.isFinite(Number(row.concept_count)) ? Number(row.concept_count) : null,
    sampleCount: Number.isFinite(Number(row.sample_count)) ? Number(row.sample_count) : null,
    productId: row.product_id || null,
    priceCents: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
    currency: row.currency || "usd",
    recurring: parseRecurring(row.recurring),
  };
}

export const canTrain = (m) => m?.role === "owner" || m?.role === "trainer";
export const canManage = (m) => m?.role === "owner";
