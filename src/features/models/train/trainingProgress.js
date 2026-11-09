/**
 * Turn the training job's log lines into something people can follow.
 *
 * The trainer writes lines like:
 *   "Training started on worker ..."           (worker)
 *   "architecture lstm", "input_sequence_length 42", ...
 *   "Epoch 12 of up to 400: accuracy 83%, validation 79%"
 *   "Finished learning; saving the model"
 *   "Exported browser (TF.js) model" | "TF.js export skipped; ..."
 *   "Validation accuracy 81.25%", "Test accuracy 78.00%"
 *   "Training Complete!" | "Training failed: ..." | "Training cancelled"
 */

export const STAGES = [
  { key: "queued", label: "Waiting for a trainer" },
  { key: "preparing", label: "Preparing your samples" },
  { key: "learning", label: "Learning" },
  { key: "saving", label: "Saving the model" },
  { key: "testing", label: "Checking accuracy" },
  { key: "done", label: "Done" },
];

const EPOCH = /^Epoch (\d+) of up to (\d+)(?::\s*(.*))?$/;
const PCT = /(accuracy|validation)\s+(\d+(?:\.\d+)?)%/g;
const FINAL = /^(Validation|Test) accuracy (\d+(?:\.\d+)?)%$/;

export function parseProgress(messages = [], status = "queued") {
  const state = {
    stage: status === "queued" ? "queued" : "preparing",
    epoch: 0,
    maxEpochs: null,
    accuracy: null,
    validation: null,
    finalValidation: null,
    finalTest: null,
    browserExport: null,
    failure: null,
  };
  for (const { message } of messages) {
    const line = String(message || "").trim();
    let m = EPOCH.exec(line);
    if (m) {
      state.stage = "learning";
      state.epoch = Number(m[1]);
      state.maxEpochs = Number(m[2]);
      for (const [, name, value] of (m[3] || "").matchAll(PCT)) state[name] = Number(value) / 100;
      continue;
    }
    if (line.startsWith("Finished learning")) state.stage = "saving";
    else if (line.startsWith("Exported browser")) state.browserExport = true;
    else if (line.startsWith("TF.js export skipped")) state.browserExport = false;
    else if ((m = FINAL.exec(line))) {
      state.stage = "testing";
      if (m[1] === "Validation") state.finalValidation = Number(m[2]) / 100;
      else state.finalTest = Number(m[2]) / 100;
    } else if (line === "Training Complete!") state.stage = "done";
    else if (line.startsWith("Training failed")) state.failure = line.replace(/^Training failed:\s*/, "");
  }
  if (status === "complete") state.stage = "done";
  return state;
}

/** 0..100 for the progress bar; epochs stop early, so learning fills most of the bar loosely. */
export function progressPercent(p, status) {
  if (status === "complete") return 100;
  switch (p.stage) {
    case "queued":
      return 2;
    case "preparing":
      return 8;
    case "learning": {
      // Early stopping usually ends well before maxEpochs; ease towards 85% instead of a false ETA.
      const t = 1 - Math.exp(-p.epoch / 60);
      return Math.round(10 + 75 * t);
    }
    case "saving":
      return 88;
    case "testing":
      return 94;
    case "done":
      return 100;
    default:
      return 5;
  }
}

export const isTerminal = (status) => status === "complete" || status === "failed" || status === "cancelled";

export function percent(value) {
  return value == null ? "–" : `${Math.round(value * 100)}%`;
}
