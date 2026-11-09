import { parseYouTubeVideoId } from "../../utils/youtubeUrl";

/**
 * YouTube IFrame API wrapper shared by the Subtitle Designer and the viewer.
 *
 *  - The API script loads once; a load that never finishes (blocked by an extension, a
 *    firewall, no network) rejects after a timeout instead of hanging.
 *  - load() calls are serialized and wait for the player to be ready, so choosing a second
 *    video quickly can't call into a half-built player.
 *  - onReady has a timeout too, and every YouTube error code becomes a sentence.
 */

const API_URL = "https://www.youtube.com/iframe_api";
export const API_TIMEOUT_MS = 15000;
export const READY_TIMEOUT_MS = 15000;

let ytApiPromise = null;

export function loadYouTubeIframeAPI({ timeoutMs = API_TIMEOUT_MS } = {}) {
  if (typeof window !== "undefined" && window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ytApiPromise = null;
      reject(new YouTubeError("api-timeout", "YouTube didn't load. Check your connection, or turn off ad or privacy blockers for this site."));
    }, timeoutMs);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      if (typeof prev === "function") prev();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = API_URL;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      ytApiPromise = null;
      reject(new YouTubeError("api-failed", "YouTube couldn't be reached. Check your connection, or turn off ad or privacy blockers for this site."));
    };
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

/** Test hook. */
export function resetYouTubeApiForTests() {
  ytApiPromise = null;
}

export class YouTubeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "YouTubeError";
    this.code = code;
  }
}

/** YouTube player onError codes -> { code, message }. */
export function describeYouTubeError(data) {
  switch (Number(data)) {
    case 2:
      return { code: "invalid", message: "That doesn't look like a valid YouTube video." };
    case 5:
      return { code: "html5", message: "This video can't play in your browser. Try another browser or video." };
    case 100:
      return { code: "unavailable", message: "This video was removed, is private, or doesn't exist." };
    case 101:
    case 150:
      return { code: "not-embeddable", message: "The video's owner doesn't allow it to be played on other sites. Choose another video." };
    case 153:
      return { code: "referrer", message: "YouTube refused to play the video here (missing referrer). Reload the page and try again." };
    default:
      return { code: "unknown", message: "YouTube couldn't play this video." };
  }
}

export class YouTubePlayerController {
  /**
   * @param {HTMLElement} containerEl element the player replaces
   * @param {{onReady?, onStateChange?, onError?, onPlaybackRateChange?, playerVars?, readyTimeoutMs?}} options
   */
  constructor(containerEl, options = {}) {
    this.containerEl = containerEl;
    this.options = options;
    this.player = null;
    this.ready = false;
    this.videoId = null;
    this.destroyed = false;
    this._queue = Promise.resolve();
  }

  /** Cue a video (by id or URL). Serialized; resolves the video id once the player is ready. */
  load(urlOrId, { startSeconds = 0 } = {}) {
    const run = () => this._load(urlOrId, startSeconds);
    const next = this._queue.then(run, run);
    this._queue = next.catch(() => {});
    return next;
  }

  async _load(urlOrId, startSeconds) {
    const videoId = parseYouTubeVideoId(urlOrId);
    if (!videoId) throw new YouTubeError("invalid", "That doesn't look like a YouTube video link.");
    const YT = await loadYouTubeIframeAPI();
    if (this.destroyed) return null;

    if (this.player && this.ready) {
      if (this.videoId !== videoId) this.player.cueVideoById({ videoId, startSeconds });
      else if (startSeconds) this.player.seekTo(startSeconds, true);
      this.videoId = videoId;
      return videoId;
    }

    // A previous player that never became ready is replaced.
    this._destroyPlayer();
    const timeoutMs = this.options.readyTimeoutMs ?? READY_TIMEOUT_MS;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new YouTubeError("ready-timeout", "The YouTube player didn't start. Reload the page, or turn off blockers for youtube.com."));
      }, timeoutMs);
      const mount = document.createElement("div");
      this.containerEl.innerHTML = "";
      this.containerEl.appendChild(mount);
      this.player = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          start: startSeconds ? Math.floor(startSeconds) : undefined,
          ...(this.options.playerVars || {}),
        },
        events: {
          onReady: (event) => {
            clearTimeout(timer);
            if (this.destroyed) return;
            this.ready = true;
            this.options.onReady?.(event);
            resolve();
          },
          onStateChange: (event) => this.options.onStateChange?.(event),
          onError: (event) => {
            const info = describeYouTubeError(event?.data);
            this.options.onError?.(info, event);
            if (!this.ready) {
              clearTimeout(timer);
              reject(new YouTubeError(info.code, info.message));
            }
          },
          onPlaybackRateChange: (event) => this.options.onPlaybackRateChange?.(event),
        },
      });
    });
    this.videoId = videoId;
    return videoId;
  }

  _call(method, ...args) {
    const fn = this.player && this.ready ? this.player[method] : null;
    if (typeof fn !== "function") return undefined;
    try {
      return fn.apply(this.player, args);
    } catch {
      return undefined;
    }
  }

  getCurrentTime() {
    return this._call("getCurrentTime") ?? 0;
  }

  getDuration() {
    return this._call("getDuration") ?? 0;
  }

  getState() {
    return this._call("getPlayerState") ?? -1;
  }

  getVideoData() {
    return this._call("getVideoData") ?? {};
  }

  getPlaybackRate() {
    return this._call("getPlaybackRate") ?? 1;
  }

  getPlaybackQuality() {
    return this._call("getPlaybackQuality") ?? null;
  }

  play() {
    this._call("playVideo");
  }

  pause() {
    this._call("pauseVideo");
  }

  seekTo(seconds) {
    this._call("seekTo", Math.max(0, seconds), true);
  }

  setVolume(volume) {
    this._call("setVolume", Math.max(0, Math.min(100, Math.round(volume))));
  }

  getVolume() {
    return this._call("getVolume") ?? 100;
  }

  mute() {
    this._call("mute");
  }

  unMute() {
    this._call("unMute");
  }

  isMuted() {
    return Boolean(this._call("isMuted"));
  }

  setPlaybackRate(rate) {
    this._call("setPlaybackRate", rate);
  }

  _destroyPlayer() {
    try {
      this.player?.destroy?.();
    } catch {
      // the iframe may already be gone with its DOM node
    }
    this.player = null;
    this.ready = false;
  }

  destroy() {
    this.destroyed = true;
    this._destroyPlayer();
  }
}

export const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
