/**
 * IndexedDB storage for Subtitle Designer uploads.
 *
 *  - shotBlobs        blob per server shot id (legacy; kept so old entries can be cleaned)
 *  - pendingSegments  recorded segments not yet uploaded: { key, recordingId, shotId, localId,
 *                     blob, mimeType, start, end, jsStart, jsEnd, createdAt }. A segment stays
 *                     here until its upload is finalized, so a reload or crash never loses it.
 *
 * Everything resolves quietly (no-ops) where IndexedDB is unavailable (private windows, some
 * embedded browsers, tests): uploads still work, they just can't resume after a reload.
 */

const DB_NAME = "TalkMotionUploads";
const SHOT_STORE = "shotBlobs";
const SEGMENT_STORE = "pendingSegments";
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SHOT_STORE)) db.createObjectStore(SHOT_STORE);
      if (!db.objectStoreNames.contains(SEGMENT_STORE)) {
        const store = db.createObjectStore(SEGMENT_STORE, { keyPath: "key" });
        store.createIndex("recordingId", "recordingId", { unique: false });
      }
    };
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function run(storeName, mode, operation) {
  return getDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], mode);
        const request = operation(tx.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
      })
  );
}

const quietly = (promise, fallback) => promise.catch(() => fallback);

// ---------------------------------------------------------------- pending segments

export function putPendingSegment(record) {
  return quietly(run(SEGMENT_STORE, "readwrite", (store) => store.put(record)), undefined);
}

export function deletePendingSegment(key) {
  return quietly(run(SEGMENT_STORE, "readwrite", (store) => store.delete(key)), undefined);
}

export function listPendingSegments(recordingId) {
  return quietly(
    run(SEGMENT_STORE, "readonly", (store) => store.index("recordingId").getAll(String(recordingId))),
    []
  ).then((rows) => (rows || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
}

export const segmentStore = {
  put: putPendingSegment,
  delete: deletePendingSegment,
  list: listPendingSegments,
};

// ---------------------------------------------------------------- legacy shot blobs

export function putShotBlob(shotId, blob) {
  return run(SHOT_STORE, "readwrite", (store) => store.put(blob, shotId));
}

export function getShotBlob(shotId) {
  return run(SHOT_STORE, "readonly", (store) => store.get(shotId)).then((r) => r || null);
}

export function deleteShotBlob(shotId) {
  return run(SHOT_STORE, "readwrite", (store) => store.delete(shotId));
}

export function clearAllShotBlobs() {
  return run(SHOT_STORE, "readwrite", (store) => store.clear());
}
