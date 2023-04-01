import useSlSubtitles from "./useSlSubtitles";

function useVideoWithSlSubtitles() {
  const {
    getCurrentRecording,
    loadYouTubeURLOnRecordIdChange,
    hasGetUserMedia,
    // enterPip,
    // exitPip,
  } = useSlSubtitles();

  const video = document.createElement("video");
  video.style.width = "100%";

  async function enterPip() {
    if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        }
        await video.requestPictureInPicture();
        video.style.visibility = "hidden";
        // eslint-disable-next-line
        state.in_pip = true;
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function exitPip() {
    if (video !== undefined) {
      video.style.visibility = "visible";
    }
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      // eslint-disable-next-line
      state.in_pip = false;
    }
  }

  function on_ready_callback(event) {
    console.log(event);
    //state.camcorder = new camcorder('camera_video', get_current_recording(), state.youtube_player.get_player(), open_recording_shot, close_recording_shot);
    //state.camcorder.recordStream();
    // state.recording_button.is_recording_mode_on()
    if (hasGetUserMedia()) {
      // Good to go!
    } else {
      alert("getUserMedia() is not supported in your browser");
    }
    play_youtube_sl_together();
  }

  function on_player_state_changed_callback(event) {
    console.log(event);
    if (event.data == -1) {
      console.log("started");
      console.log(event.target.videoTitle);
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.ENDED) {
      console.log("ended");
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PLAYING) {
      console.log("playing");
      // eslint-disable-next-line
      console.log(state.youtube_player.get_current_play_time());
      let current_recording = getCurrentRecording();
      current_recording.set_info(
        event.target.playerInfo.videoData.title,
        event.target.playerInfo.videoData.author,
        event.target.playerInfo.videoData.video_quality,
        event.target.playerInfo.duration,
        event.target.playerInfo.currentTimeLastUpdated_,
        event.target.playerInfo.availablePlaybackRates,
        event.target.playerInfo.playbackRate,
        event.target.playerInfo.availableQualityLevels,
        event.target.playerInfo.playbackQuality
      );

      // readjust the recorded video to play from middle based on current time in youtube video
      // Select the first video element on the page
      const video = document.querySelector('video');
      if (video !== undefined) {
        let currentTime = state.youtube_player.get_current_play_time();
        let plan = current_recording.get_record_play_plan();
        let start_times = Object.keys(plan);
        let i = 0;
        do {
            i++;
        } while( !(currentTime < start_times[i] && start_times[i-1] < currentTime) && i < start_times.length);
        let current_video = plan[start_times[i-1]];
        if (current_video.url !== video.src) {
            video.pause();
            video.src = current_video.url;
            video.load();
        }
        video.currentTime = currentTime - start_times[i-1];
        var isPlaying = video.currentTime > 0 && !video.paused && !video.ended
            && video.readyState > video.HAVE_CURRENT_DATA;
        console.log(isPlaying);
        if (!isPlaying) {
            video.play();  // trigger video load
        }
        console.log(currentTime, start_times[i-1], currentTime - start_times[i-1]);
        console.log(current_video.url, video.src)
      }
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PAUSED) {
      console.log("paused");
      // eslint-disable-next-line
      console.log(state.youtube_player.get_current_play_time());
      // pause the recorded video if youtube video is paused.
      // Select the first video element on the page
      const video = document.querySelector('video');
      if (video !== undefined) {
        video.pause();
      }
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.BUFFERING) {
      console.log("buffering");
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.CUED) {
      console.log("CUED");
    }
  }

  function play_video(v) {
    const box = document.getElementById("box");

    while (box && box.lastElementChild) {
      box.removeChild(box.lastElementChild);
    }
    video.setAttribute("id", "vid" + v.start);
    // eslint-disable-next-line
    if (state.in_pip) {
      //video.style.visibility = "hidden";
    } else {
      video.style.visibility = "visible";
    }
    video.onloadedmetadata = function () {
      // eslint-disable-next-line
      if (state.in_pip) {
        enterPip(); // video
      } else {
        exitPip(); // video
      }
    };
    video.src = v.url;
    var isPlaying =
      video.currentTime > 0 &&
      !video.paused &&
      !video.ended &&
      video.readyState > video.HAVE_CURRENT_DATA;
    video.controls = true;
    video.muted = false;
    video.height = 390;
    video.width = 640;

    box && box.appendChild(video);
    if (!isPlaying) {
      //await video.play();
      var playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then((_) => {
            // Automatic playback started!
            // Show playing UI.
            console.log(_);
            console.log("Show playing UI");
            if (box && box !== undefined) {
              box.style.visibility = "visible";
            }
          })
          .catch((error) => {
            // Auto-play was prevented
            // Show paused UI.
            console.log("Show paused UI", error);
          });
      }
    }
  }

  async function play_youtube_sl_together() {
    let current_recording = getCurrentRecording();
    let plan = current_recording.get_record_play_plan();
    // eslint-disable-next-line
    state.youtube_player.player.playVideo();
    // eslint-disable-next-line
    state.youtube_player.player.seekTo(0);
    // eslint-disable-next-line
    let previous_player_time = await state.youtube_player.player.playerInfo
      .currentTime;
    //let skipfirst = true;

    // eslint-disable-next-line
    var intervalId = window.setInterval(function () {
      // call your function here
      for (const [key, value] of Object.entries(plan)) {
        // console.log(key, value);
        if (
          previous_player_time < key &&
          // eslint-disable-next-line
          state?.youtube_player?.player?.playerInfo?.currentTime > key
        ) {
          console.log(previous_player_time);
          // eslint-disable-next-line
          console.log(state.youtube_player.player.playerInfo.currentTime);
          console.log(value.url);
          play_video(value);
        }
      }
      // eslint-disable-next-line
      if(state.youtube_player !== undefined || state.youtube_player !== null) {
        previous_player_time = state.youtube_player.player.playerInfo.currentTime;
      }
      //   let max_time = Object.keys(plan).reduce((a, b) =>
      //     plan[a] > plan[b] ? a : b
      //   );
      //        if (state.youtube_player.player.playerInfo.currentTime > max_time) {
      //            clearInterval(intervalId);
      //        }
    }, 1);
  }

  function injectYouTubeAPIScript() {
    const isYouTubeAPIScriptAlreadyInjected = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (isYouTubeAPIScriptAlreadyInjected) return;
    let firstScriptTag = document.getElementsByTagName("script")[0];
    let script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    firstScriptTag.parentNode.insertBefore(script, firstScriptTag);

    const recordingStateScript = document.getElementById(
      "recording_state_script"
    );
    if (recordingStateScript) {
      recordingStateScript.remove();
    }

    const newRecordingStateScript = document.createElement("script");
    newRecordingStateScript.id = "recording_state_script";
    newRecordingStateScript.innerHTML = "var state = new recording_state();";
    firstScriptTag.parentNode.append(newRecordingStateScript);

    // eslint-disable-next-line
    state.set_is_recorder(false);
    // eslint-disable-next-line
    state.set_on_ready_callback(on_ready_callback);
    // eslint-disable-next-line
    state.set_on_player_state_changed_callback(
      on_player_state_changed_callback
    );
    // eslint-disable-next-line
    state.set_in_pip(true);
  }

  injectYouTubeAPIScript();

  return {
    injectYouTubeAPIScript,
    loadYouTubeURLOnRecordIdChange,
    enterPip,
    exitPip,
  };
}

export default useVideoWithSlSubtitles;
