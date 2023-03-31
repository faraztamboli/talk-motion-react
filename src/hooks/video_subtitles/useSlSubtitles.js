import JS2Py from "../../remotepyjs";
import useLocalStorage from "../useLocalStorage";

function useSlSubtitles() {
  const [token] = useLocalStorage("token");

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

  function hasGetUserMedia() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  }

  function loadYouTubeURLOnRecordIdChange(recordingId) {
    let withShots = false;
    // eslint-disable-next-line
    state.is_recorder ? (withShots = true) : (withShots = false);

    JS2Py.PythonFunctions.TalkMotionServer.getVideoRecording(
      token,
      parseInt(recordingId),
      withShots,
      function (result) {
        console.log(result);
        // eslint-disable-next-line
        console.log(state.on_player_state_changed_callback);
        // eslint-disable-next-line
        state.youtube_player = new youtube_player(
          "youtube_video_frame",
          result.original_video_url,
          // eslint-disable-next-line
          state.on_ready_callback,
          // eslint-disable-next-line
          state.on_player_state_changed_callback
        );
        // eslint-disable-next-line
        let original_video_url = state.youtube_player.get_video_url();
        // eslint-disable-next-line
        state.recordings[original_video_url] = new recording(
          result.title,
          result.description,
          original_video_url,
          result.id
        );
        // eslint-disable-next-line
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
          // eslint-disable-next-line
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
          // eslint-disable-next-line
          state.recordings[original_video_url].add_shot(shot);
        }
        // eslint-disable-next-line
        if (state.is_recorder) {
          // let current_recording = getCurrentRecording();
          let youtube_url = document.getElementById("youtube_url");
          if (youtube_url !== undefined) {
            // eslint-disable-next-line
            youtube_url.value = state.youtube_player.video_code;
          }
        }
      }
    );
  }

  async function enterPip(videoElement) {
    if (
      document.pictureInPictureEnabled &&
      !videoElement.disablePictureInPicture
    ) {
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        }
        await videoElement.requestPictureInPicture();
        videoElement.style.visibility = "hidden";
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function exitPip(videoElement) {
    if (videoElement !== undefined) {
      videoElement.style.visibility = "visible";
    }
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }

  return {
    getCurrentRecording,
    hasGetUserMedia,
    loadYouTubeURLOnRecordIdChange,
    enterPip,
    exitPip,
  };
}

export default useSlSubtitles;
