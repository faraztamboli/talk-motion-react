import useLocalStorage from "../useLocalStorage";
import JS2Py from "../../remotepyjs";
import useSlSubtitles from "./useSlSubtitles";

function useSlSubtitleDesigner() {
  const [token] = useLocalStorage("token");
  const {
    hasGetUserMedia,
    // enterPip,
    // exitPip,
    loadYouTubeURLOnRecordIdChange,
  } = useSlSubtitles();
  // const { hasGetUserMedia } = useSlSubtitles();
  // const { isRecordingModeOn } = useSelector(
  //   (state) => state.subtitleRecordingButton
  // );

  function getCurrentRecording() {
    // eslint-disable-next-line
    if (state == null || state.youtube_player == null) alert("ERROR");

    // else
    // eslint-disable-next-line
    let video_code = state.youtube_player.get_video_code();
    // eslint-disable-next-line
    let originalRecordingURL = state.youtube_player.get_video_url();

    // eslint-disable-next-line
    return state.recordings[originalRecordingURL];
  }

  function openRecordingShot(
    recordingId,
    originalVideoStart,
    recordingStart,
    jsStart
  ) {
    JS2Py.PythonFunctions.TalkMotionServer.openVideoRecordingShot(
      token,
      recordingId,
      originalVideoStart,
      recordingStart,
      jsStart,
      function (result) {
        console.log(result);
        let current_recording = getCurrentRecording();
        current_recording.get_active_shot().recording_shot_id =
          result.video_recording_shot_id;
        console.log(current_recording);
      }
    );
  }

  function closeRecordingShot(
    videoRecordingShotId,
    chunkSize,
    originalVideoEnd,
    recordingEnd,
    jsEnd,
    shot,
    activeParts
  ) {
    console.log(videoRecordingShotId);
    JS2Py.PythonFunctions.TalkMotionServer.closeVideoRecordingShotWithVideo(
      videoRecordingShotId,
      chunkSize,
      originalVideoEnd,
      recordingEnd,
      jsEnd,
      shot,
      activeParts,
      function (result) {
        console.log(videoRecordingShotId);
        let currentRecording = getCurrentRecording();
        currentRecording.get_active_shot().set_video_url(result.video_url);
        console.log(result, currentRecording);
      }
    );
  }

  function onReadyCallback(event) {
    console.log(event);

    // eslint-disable-next-line
    state.camcorder = new camcorder(
      "camera_video",
      getCurrentRecording(),
      // eslint-disable-next-line
      state.youtube_player.get_player(),
      openRecordingShot,
      closeRecordingShot
    );

    // eslint-disable-next-line
    state.camcorder.recordStream();
    hasGetUserMedia()
      ? console.log("Good to go")
      : console.log("getUserMedia is not supported on your browser");
  }

  function onPlayerStateChangedCallback(event) {
    // eslint-disable-next-line
    console.log(event, state);
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
      // updateVideoRecording: update recording in database use current_recording.recording_id
      JS2Py.PythonFunctions.TalkMotionServer.updateVideoRecording(
        current_recording.recording_id,
        event.target.playerInfo.videoData.title,
        event.target.playerInfo.videoData.author,
        event.target.playerInfo.videoData.video_quality,
        event.target.playerInfo.duration,
        event.target.playerInfo.currentTimeLastUpdated_,
        event.target.playerInfo.playbackRate,
        event.target.playerInfo.playbackQuality,
        function (result) {
          console.log(result);
        }
      );

      // eslint-disable-next-line
      if (state.recording_button.is_recording_mode_on()) {
        // eslint-disable-next-line
        state.camcorder.resumeRecording();
      }
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PAUSED) {
      console.log("paused");
      // eslint-disable-next-line
      console.log(state.youtube_player.get_current_play_time());
      // eslint-disable-next-line
      if (state.recording_button.is_recording_mode_on()) {
        // eslint-disable-next-line
        state.camcorder.pauseRecording();
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

  function loadYoutubeURLOnURLChange(youTubeURL, title, description) {
    // eslint-disable-next-line
    state.youtube_player = new youtube_player(
      "youtube_video_frame",
      youTubeURL,
      onReadyCallback,
      onPlayerStateChangedCallback
    );
    // TODO: update the youTubeURL
    // eslint-disable-next-line
    youTubeURL = state.youtube_player.get_video_code();
    // eslint-disable-next-line
    console.log(state.youtube_player.get_video_url());

    // eslint-disable-next-line
    if (!(state.youtube_player.get_video_url() in state.recordings)) {
      // eslint-disable-next-line
      state.recordings[state.youtube_player.get_video_url()] = new recording(
        title,
        description,
        // eslint-disable-next-line
        state.youtube_player.get_video_url()
      );
    }

    JS2Py.PythonFunctions.TalkMotionServer.createVideoRecording(
      title,
      description,
      // eslint-disable-next-line
      state.youtube_player.get_video_url(),
      function (result) {
        console.log(result);

        // eslint-disable-next-line
        state.recordings[state.youtube_player.get_video_url()].recording_id =
          result.video_recording_id;
      }
    );
  }

  function injectYouTubeAPIScript() {
    const isYouTubeAPIScriptAlreadyInjected = document.querySelector(
      'script[src="https://www.youtube.com/player_api"]'
    );
    if (isYouTubeAPIScriptAlreadyInjected) return;
    let firstScriptTag = document.getElementsByTagName("script")[0];
    let script = document.createElement("script");
    script.src = "https://www.youtube.com/player_api";
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
    state.recording_button = new recording_button("recButton", state);
    // eslint-disable-next-line
    state.set_is_recorder(true);
    // eslint-disable-next-line
    state.set_on_ready_callback(onReadyCallback);
    // eslint-disable-next-line
    state.set_on_player_state_changed_callback(onPlayerStateChangedCallback);
    // eslint-disable-next-line
    state.set_in_pip(false);
  }

  injectYouTubeAPIScript();

  return {
    injectYouTubeAPIScript,
    loadYoutubeURLOnURLChange,
    loadYouTubeURLOnRecordIdChange,
    onReadyCallback,
    onPlayerStateChangedCallback,
  };
}

export default useSlSubtitleDesigner;
