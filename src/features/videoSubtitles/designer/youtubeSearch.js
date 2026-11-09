/**
 * YouTube Data API v3 search for the Subtitle Designer. Only videos that may be embedded on
 * other sites are returned (videoEmbeddable=true), so nobody records over a video the player
 * then refuses to play.
 */

const ENTITY = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };

/** The API returns titles HTML-escaped ("Rock &amp; Roll", "It&#39;s"). */
export function decodeEntities(text) {
  return String(text || "").replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    const lower = code.toLowerCase();
    if (ENTITY[lower] !== undefined) return ENTITY[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return match;
  });
}

export function searchUrl({ apiKey, query, pageToken = null, maxResults = 12 }) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query.trim(),
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    maxResults: String(maxResults),
    key: apiKey,
  });
  if (pageToken) params.set("pageToken", pageToken);
  return `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
}

export function parseSearchResponse(data) {
  const videos = (data?.items || [])
    .filter((item) => item?.id?.videoId)
    .map((item) => {
      const s = item.snippet || {};
      const t = s.thumbnails || {};
      return {
        videoId: item.id.videoId,
        title: decodeEntities(s.title),
        description: decodeEntities(s.description),
        channelTitle: decodeEntities(s.channelTitle),
        thumbnail: t.medium?.url || t.high?.url || t.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
        publishedAt: s.publishedAt || null,
      };
    });
  return { videos, nextPageToken: data?.nextPageToken || null };
}

export function describeSearchError(status, body) {
  const reason = body?.error?.errors?.[0]?.reason;
  if (status === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded")) {
    return "YouTube search has reached today's limit. Paste a video link instead.";
  }
  if (status === 400 || status === 403) return "YouTube search isn't available right now. Paste a video link instead.";
  return "YouTube search didn't work. Check your connection, or paste a video link instead.";
}

export async function searchYouTube({ apiKey, query, pageToken = null, signal, fetchImpl = fetch }) {
  const response = await fetchImpl(searchUrl({ apiKey, query, pageToken }), { signal });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw new Error(describeSearchError(response.status, body));
  return parseSearchResponse(body);
}
