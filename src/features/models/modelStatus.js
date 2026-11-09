/** One status for a model card or header, from training state and the latest job. */
export function modelStatus(model) {
  const job = model?.lastJobStatus;
  if (job === "queued" || job === "running") return { key: "training", label: "Training…", color: "processing" };
  if (job === "failed" && !model?.trained) return { key: "failed", label: "Training failed", color: "error" };
  if (model?.trained) return { key: "ready", label: "Ready to translate", color: "success" };
  if (model?.trained === false && (model?.sampleCount || 0) > 0) return { key: "untrained", label: "Not trained yet", color: "warning" };
  if (model?.trained === false) return { key: "new", label: "New", color: "default" };
  return { key: "unknown", label: null, color: "default" };
}

export const ROLE_LABEL = { owner: "Owner", trainer: "Trainer", purchaser: "Purchased" };
