// Stand-in for https://www.youtube.com/iframe_api: the YT.Player surface the app uses, with a
// real-time clock, asynchronous state events (like the postMessage-based original) and the
// IFrame API's state codes. window.__fakeYT.players lets the test press play/pause/seek, the way
// a person does inside YouTube's own iframe.
(function () {
  const S = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  const DURATION = 120;
  const players = [];

  class Player {
    constructor(el, opts) {
      const mount = typeof el === "string" ? document.getElementById(el) : el;
      this.opts = opts || {};
      this.events = this.opts.events || {};
      this.videoId = this.opts.videoId;
      this.state = S.UNSTARTED;
      this.base = 0;
      this.startedAt = null;
      this.rate = 1;
      this.muted = false;
      this.volume = 100;
      const box = document.createElement("div");
      box.className = "fake-yt";
      box.style.cssText = "width:100%;height:100%;min-height:240px;background:#123;color:#fff;font:20px monospace;display:flex;align-items:center;justify-content:center";
      mount.replaceWith(box);
      this.box = box;
      this.timer = setInterval(() => this._tick(), 100);
      players.push(this);
      setTimeout(() => this.events.onReady && this.events.onReady({ target: this }), 50);
    }
    _emit(state) {
      this.state = state;
      setTimeout(() => this.events.onStateChange && this.events.onStateChange({ target: this, data: state }), 10);
    }
    _tick() {
      const t = this.getCurrentTime();
      this.box.textContent = `FAKE YOUTUBE ${this.videoId} t=${t.toFixed(1)}s state=${this.state}`;
      if (this.state === S.PLAYING && t >= DURATION) {
        this.base = DURATION;
        this.startedAt = null;
        this._emit(S.ENDED);
      }
    }
    getCurrentTime() {
      if (this.state === S.PLAYING && this.startedAt !== null) return Math.min(DURATION, this.base + ((performance.now() - this.startedAt) / 1000) * this.rate);
      return this.base;
    }
    getDuration() { return DURATION; }
    getPlayerState() { return this.state; }
    getPlaybackRate() { return this.rate; }
    setPlaybackRate(r) {
      if (r === this.rate) return;
      this.base = this.getCurrentTime();
      if (this.startedAt !== null) this.startedAt = performance.now();
      this.rate = r;
      setTimeout(() => this.events.onPlaybackRateChange && this.events.onPlaybackRateChange({ target: this, data: r }), 10);
    }
    getPlaybackQuality() { return "hd720"; }
    getVideoData() { return { video_id: this.videoId, title: "Test lecture", author: "Test channel" }; }
    playVideo() {
      if (this.state === S.PLAYING) return;
      this.startedAt = performance.now();
      this._emit(S.PLAYING);
    }
    pauseVideo() {
      if (this.state !== S.PLAYING) return;
      this.base = this.getCurrentTime();
      this.startedAt = null;
      this._emit(S.PAUSED);
    }
    seekTo(seconds) {
      const playing = this.state === S.PLAYING;
      this.base = Math.max(0, Math.min(DURATION, seconds));
      if (playing) {
        // Like YouTube: a short buffer, then playing again from the new point.
        this.startedAt = null;
        this._emit(S.BUFFERING);
        setTimeout(() => { this.startedAt = performance.now(); this._emit(S.PLAYING); }, 150);
      }
    }
    cueVideoById(arg) {
      this.videoId = typeof arg === "string" ? arg : arg.videoId;
      this.base = (arg && arg.startSeconds) || 0;
      this.startedAt = null;
      this._emit(S.CUED);
    }
    loadVideoById(arg) { this.cueVideoById(arg); this.playVideo(); }
    mute() { this.muted = true; }
    unMute() { this.muted = false; }
    isMuted() { return this.muted; }
    setVolume(v) { this.volume = v; }
    getVolume() { return this.volume; }
    getIframe() { return this.box; }
    destroy() { clearInterval(this.timer); this.box.remove(); const i = players.indexOf(this); if (i >= 0) players.splice(i, 1); }
  }

  window.YT = { Player, PlayerState: S, loaded: 1 };
  window.__fakeYT = { players, S };
  setTimeout(() => window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(), 0);
})();
