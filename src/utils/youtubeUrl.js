/**
 * Single source of truth for YouTube URL parsing/validation.
 * Used by the Subtitle Designer, its viewer and libraries.
 */

const VIDEO_ID_RE = /^[\w-]{11}$/;

/**
 * Extract the 11-character video id from any common YouTube URL form
 * (watch, youtu.be, embed, shorts) or a bare video id.
 * @param {string} url
 * @returns {string|null} video id, or null if the input is not recognizable
 */
export function parseYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  let parsed;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  let candidate = null;

  if (host === 'youtu.be') {
    candidate = parsed.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      candidate = parsed.searchParams.get('v');
    } else {
      const match = parsed.pathname.match(/^\/(?:embed|shorts|v|live)\/([\w-]{11})/);
      candidate = match ? match[1] : null;
    }
  }

  return candidate && VIDEO_ID_RE.test(candidate) ? candidate : null;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  return parseYouTubeVideoId(url) !== null;
}

/**
 * Canonical watch URL for a video id (what we store server-side).
 * @param {string} videoId
 * @returns {string}
 */
export function watchUrlForVideoId(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
