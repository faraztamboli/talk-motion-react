/**
 * Simple IndexedDB wrapper for storing shot blobs
 * Uses a single object store: 'shotBlobs' with shotId as key
 */

const DB_NAME = 'TalkMotionUploads';
const STORE_NAME = 'shotBlobs';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Open or get the database connection
 * @returns {Promise<IDBDatabase>}
 */
function getDB() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

/**
 * Store a blob for a shot ID
 * @param {number} shotId - Shot ID
 * @param {Blob} blob - Blob to store
 * @returns {Promise<void>}
 */
export async function putShotBlob(shotId, blob) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, shotId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to store blob'));
  });
}

/**
 * Retrieve a blob for a shot ID
 * @param {number} shotId - Shot ID
 * @returns {Promise<Blob|null>} Blob or null if not found
 */
export async function getShotBlob(shotId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(shotId);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error('Failed to retrieve blob'));
  });
}

/**
 * Delete a blob for a shot ID
 * @param {number} shotId - Shot ID
 * @returns {Promise<void>}
 */
export async function deleteShotBlob(shotId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(shotId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete blob'));
  });
}

/**
 * Clear all stored blobs (for cleanup)
 * @returns {Promise<void>}
 */
export async function clearAllShotBlobs() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear blobs'));
  });
}


