/**
 * Helper functions for chunked upload processing
 */

/**
 * Convert a blob slice to raw base64 string (no data: prefix)
 * @param {Blob} blobSlice - Blob slice to convert
 * @returns {Promise<string>} Raw base64 string (no prefix)
 */
export function blobChunkToRawBase64(blobSlice) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read blob chunk'));
    reader.onloadend = () => {
      const dataURL = reader.result;
      // Split at first comma and return only the payload
      const commaIndex = dataURL.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Invalid DataURL format - no comma found'));
        return;
      }
      const rawBase64 = dataURL.substring(commaIndex + 1);
      resolve(rawBase64);
    };
    reader.readAsDataURL(blobSlice);
  });
}

/**
 * Compute SHA-256 hash of a blob as hex string
 * @param {Blob} blob - Blob to hash
 * @returns {Promise<string>} Hex string of SHA-256 hash
 */
export async function sha256HexOfBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


