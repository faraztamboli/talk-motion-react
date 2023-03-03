import JS2Py from "../../remotepyjs";
import useLocalStorage from "../useLocalStorage";
import recording from "../video_subtitles_classes/recording";
import recording_shot from "../video_subtitles_classes/recordingShot";
import RecordingState from "../video_subtitles_classes/recordingState";
import youtube_player from "../video_subtitles_classes/youtubePlayer";

function useVideoWithSlSubtitles() {
  const [token] = useLocalStorage("token");

  const state = new RecordingState();

  const video = document.createElement("video");
  video.style.width = "100%";

  function getCurrentRecording() {
    try {
      if (state.youtube_player == null) return "error";

      // else
      let originalRecordingURL = state.youtube_player?.get_video_url();

      return state.recordings[originalRecordingURL];
    } catch (err) {
      console.log(err);
    }
  }

  function hasGetUserMedia() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  }

  async function enterPip() {
    if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        }
        await video.requestPictureInPicture();
        video.style.visibility = "hidden";
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
      state.in_pip = false;
    }
  }

  function loadYouTubeURLOnRecordIdChange(recordingId) {
    let withShots = false;
    state.is_recorder ? (withShots = true) : (withShots = false);

    JS2Py.PythonFunctions.TalkMotionServer.getVideoRecording(
      token,
      parseInt(recordingId),
      withShots,
      function (result) {
        console.log(result);
        state.youtube_player = new youtube_player(
          "youtube_video_frame",
          result.original_video_url,
          state.on_ready_callback,
          state.on_player_state_changed_callback
        );
        let original_video_url = state.youtube_player.get_video_url();
        state.recordings[original_video_url] = new recording(
          result.title,
          result.description,
          original_video_url
        );
        state.recordings[original_video_url].set_info(
          result.original_video_title,
          result.original_video_author,
          result.original_video_quality,
          result.original_video_duration,
          result.original_video_currentTimeLastUpdated_,
          null,
          result.original_video_playbackRate,
          null,
          result.original_video_playbackQuality
        );
        for (let i in result.recording_shots) {
          let rshot = result.recording_shots[i];
          let shot = new recording_shot(
            rshot.session_id,
            rshot.original_video_start,
            rshot.recording_start,
            rshot.js_start
          );
          shot.close(
            rshot.shot,
            rshot.video_url,
            rshot.chunk_size,
            rshot.original_video_end,
            rshot.recording_end,
            rshot.js_end
          );
          state.recordings[original_video_url].add_shot(shot);
        }
        if (state.is_recorder) {
          // let current_recording = getCurrentRecording();
          let youtube_url = document.getElementById("youtube_url");
          if (youtube_url !== undefined) {
            youtube_url.value = state.youtube_player.video_code;
          }
        }
      }
    );
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
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PAUSED) {
      console.log("paused");
      console.log(state.youtube_player.get_current_play_time());
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

    while (box.lastElementChild) {
      box.removeChild(box.lastElementChild);
    }
    video.setAttribute("id", "vid" + v.start);
    if (state.in_pip) {
      video.style.visibility = "hidden";
    } else {
      video.style.visibility = "visible";
    }
    video.onloadedmetadata = function () {
      if (state.in_pip) {
        enterPip(video);
      } else {
        exitPip(video);
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

    box.appendChild(video);
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
            if (box !== undefined) {
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
    state.youtube_player.player.playVideo();
    state.youtube_player.player.seekTo(0);
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
          state.youtube_player.player.playerInfo.currentTime > key
        ) {
          console.log(previous_player_time);
          console.log(state.youtube_player.player.playerInfo.currentTime);
          console.log(value.url);
          play_video(value);
        }
      }
      previous_player_time = state.youtube_player.player.playerInfo.currentTime;
      //   let max_time = Object.keys(plan).reduce((a, b) =>
      //     plan[a] > plan[b] ? a : b
      //   );
      //        if (state.youtube_player.player.playerInfo.currentTime > max_time) {
      //            clearInterval(intervalId);
      //        }
    }, 1);
  }

  function injectYouTubeAPIScript() {
    let script = document.createElement("script");
    script.src = "https://www.youtube.com/player_api";
    let firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
  }

  return {
    state,
    loadYouTubeURLOnRecordIdChange,
    on_ready_callback,
    on_player_state_changed_callback,
    injectYouTubeAPIScript,
    enterPip,
    exitPip,
  };
}

export default useVideoWithSlSubtitles;
