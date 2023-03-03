class youtube_player {
  constructor(
    id_video_iframe,
    url,
    on_ready_callback,
    on_player_state_changed_callback
  ) {
    this.id = id_video_iframe;
    this.player = null;
    this.video_frame = document.getElementById(id_video_iframe);
    // let youtube_url = document.getElementById('youtube_url'); // youtube_url.value is url
    this.video_code = this.get_youtube_video_code(url);
    this.video_frame.src = this.get_embedding_youtube_url(this.video_code);
    this.onYouTubePlayerAPIReady(
      on_ready_callback,
      on_player_state_changed_callback
    );
    this.on_ready_callback = on_ready_callback;
    this.on_player_state_changed_callback = on_player_state_changed_callback;

    // move this to loader in designer html
  }

  get_player() {
    return this.player;
  }

  // this function gets called when API is ready to use
  onYouTubePlayerAPIReady(on_ready_callback, on_player_state_changed_callback) {
    // create the global player from the specific iframe (#video)
    // eslint-disable-next-line
    this.player = new YT.Player(this.id, {
      height: "390",
      width: "640",
      videoId: this.video_code,
      playerVars: {
        playsinline: 1,
      },
      events: {
        // call this function when player is ready to use
        onReady: on_ready_callback,
        onStateChange: on_player_state_changed_callback,
      },
    });
  }

  onPlayerReady(event) {
    // this function doesn't understand this as it event handler for YT
    // eslint-disable-next-line
    on_ready_callback(event);
  }

  onPlayerStateChange(event) {
    // this function doesn't understand this as it event handler for YT
    // eslint-disable-next-line
    on_player_state_changed_callback(event);
  }

  get_video_code() {
    return this.video_code;
  }

  get_video_url() {
    return this.video_frame.src;
  }

  get_youtube_url() {
    let video_code = this.get_video_code();
    let original_recording_url = this.get_embedding_youtube_url(video_code);
    return original_recording_url;
  }

  get_youtube_video_code(url) {
    //let youtube_url = document.getElementById('youtube_url');
    let video_code = null;
    let is_full_url = url.indexOf("https://www.youtube.com/watch?v=");
    let is_embed_url = url.indexOf("https://www.youtube.com/embed/");
    if (is_full_url >= 0) {
      let index_of_video_code =
        is_full_url + "https://www.youtube.com/watch?v=".length;
      video_code = url.substring(index_of_video_code);
    } else if (is_embed_url >= 0) {
      let index_of_video_code =
        is_embed_url + "https://www.youtube.com/embed/".length;
      let index_of_video_code_end = url.length;
      if (url.indexOf("?enablejsapi=1&html5=1&autoplay=1") >= 0) {
        index_of_video_code_end =
          url.length - "?enablejsapi=1&html5=1&autoplay=1".length;
      } else {
        index_of_video_code_end = url.length - "?enablejsapi=1&html5=1".length;
      }
      video_code = url.substring(index_of_video_code, index_of_video_code_end);
    } else {
      video_code = url;
    }
    return video_code;
  }

  get_embedding_youtube_url(video_code) {
    return (
      "https://www.youtube.com/embed/" +
      video_code +
      "?enablejsapi=1&html5=1&autoplay=1"
    );
  }

  get_current_play_time() {
    return this.player.playerInfo.currentTime;
  }

  toString() {
    return `youtube url is ${this.get_video_url()}`;
  }
}

export default youtube_player;
