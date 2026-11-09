import { parseYouTubeVideoId } from "../../utils/youtubeUrl";

let ytApiPromise = null;

/**
 * Load the YouTube IFrame API exactly once, promise-cached.
 */
export function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      ytApiPromise = null;
      reject(new Error("Failed to load YouTube IFrame API"));
    };
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

/**
 * Thin lifecycle wrapper over YT.Player. No hand-built iframe src, no
 * globals: callers pass a container element and get typed callbacks.
 */
export class YouTubePlayerController {
  /**
   * @param {HTMLElement} containerEl - element the player replaces
   * @param {{onReady?: Function, onStateChange?: Function}} callbacks
   */
  constructor(containerEl, callbacks = {}) {
    this.containerEl = containerEl;
    this.callbacks = callbacks;
    this.player = null;
    this.destroyed = false;
  }

  /**
   * Create the player for a video id or URL. Safe to call again with a new
   * video: reuses the existing player via loadVideoById.
   * @param {string} urlOrId
   */
  async load(urlOrId) {
    const videoId = parseYouTubeVideoId(urlOrId);
    if (!videoId) throw new Error(`Not a valid YouTube URL or video id: ${urlOrId}`);

    const YT = await loadYouTubeIframeAPI();
    if (this.destroyed) return null;

    if (this.player) {
      this.player.cueVideoById(videoId);
      return videoId;
    }

    await new Promise((resolve) => {
      this.player = new YT.Player(this.containerEl, {
        width: "100%",
        height: "390",
        videoId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: (event) => {
            this.callbacks.onReady?.(event);
            resolve();
          },
          onStateChange: (event) => this.callbacks.onStateChange?.(event),
        },
      });
    });
    return videoId;
  }

  getCurrentTime() {
    return this.player?.getCurrentTime?.() ?? 0;
  }

  getDuration() {
    return this.player?.getDuration?.() ?? 0;
  }

  getVideoData() {
    return this.player?.getVideoData?.() ?? {};
  }

  getPlaybackRate() {
    return this.player?.getPlaybackRate?.() ?? 1;
  }

  getPlaybackQuality() {
    return this.player?.getPlaybackQuality?.() ?? null;
  }

  seekTo(seconds) {
    this.player?.seekTo?.(seconds, true);
  }

  pause() {
    this.player?.pauseVideo?.();
  }

  destroy() {
    this.destroyed = true;
    try {
      this.player?.destroy?.();
    } catch {
      // player may already be gone with the DOM node
    }
    this.player = null;
  }
}
