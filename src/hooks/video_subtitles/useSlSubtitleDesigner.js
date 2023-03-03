import useLocalStorage from "../useLocalStorage";
import JS2Py from "../../remotepyjs";
import useSlSubtitles from "./useSlSubtitles";
import Camcorder from "../video_subtitles_classes/camcorder";
import YoutubePlayer from "../video_subtitles_classes/youtubePlayer";
import RecordingState from "../video_subtitles_classes/recordingState";
import Recording from "../video_subtitles_classes/recording";
import RecordingShot from "../video_subtitles_classes/recordingShot";
import { useSelector } from "react-redux";

function useSlSubtitleDesigner() {
  const [token] = useLocalStorage("token");
  const { hasGetUserMedia } = useSlSubtitles();
  const { isRecordingModeOn } = useSelector(
    (state) => state.subtitleRecordingButton
  );

  let state = new RecordingState();

  function getCurrentRecording() {
    try {
      if (state == null || state.youtube_player == null) {
        console.log("error");
        return "error";
      } else {
        console.log(state);
        let originalRecordingURL = state.youtube_player?.get_video_url();
        console.log(state.recordings[originalRecordingURL]);
        return state.recordings[originalRecordingURL];
      }
    } catch (err) {
      console.log(err);
    }
  }

  function openRecordingShot(
    recordingId,
    originalVideoStart,
    recordingStart,
    jsStart
  ) {
    try {
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
    } catch (err) {
      console.log(err);
    }
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
    try {
      JS2Py.PythonFunctions.TalkMotionServer.closeVideoRecordingShotWithVideo(
        videoRecordingShotId,
        chunkSize,
        originalVideoEnd,
        recordingEnd,
        jsEnd,
        shot,
        activeParts,
        function (result) {
          let currentRecording = getCurrentRecording();
          currentRecording.get_active_shot.set_video_url(result?.video_url);
          console.log(result, currentRecording);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function onReadyCallback(event) {
    console.log(event);
    try {
      const cam = new Camcorder(
        "camera_video",
        getCurrentRecording(),
        state.youtube_player.get_player(),
        openRecordingShot,
        closeRecordingShot
      );

      state.camcorder = cam;
      state.camcorder.recordStream();
      hasGetUserMedia
        ? console.log("Good to go")
        : console.log("getUserMedia is not supported on your browser");
    } catch (err) {
      console.log(err);
    }
  }

  function onPlayerStateChangedCallback(event) {
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

      if (isRecordingModeOn) {
        state.camcorder.resumeRecording();
      }
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PAUSED) {
      console.log("paused");
      console.log(state.youtube_player.get_current_play_time());
      if (isRecordingModeOn) {
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
    try {
      const ytPlayer = new YoutubePlayer(
        "youtube_video_frame",
        youTubeURL,
        onReadyCallback,
        onPlayerStateChangedCallback
      );
      state.youtube_player = ytPlayer;
      // TODO: update the youTubeURL
      youTubeURL = state.youtube_player.get_video_code();
      console.log(state.youtube_player.get_video_url());

      if (!(state.youtube_player?.getVideoURL in state.recordings)) {
        state.recordings[state.youtube_player.get_video_url()] = new Recording(
          title,
          description,
          state.youtube_player.get_video_url()
        );
      }

      JS2Py.PythonFunctions.TalkMotionServer.createVideoRecording(
        title,
        description,
        state.youtube_player.get_video_url(),
        function (result) {
          console.log(result);

          state.recordings[state.youtube_player.get_video_url()].recording_id =
            result.video_recording_id;
        }
      );
    } catch (err) {
      console.log(err);
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
        state.youtube_player = new YoutubePlayer(
          "youtube_video_frame",
          result.original_video_url,
          state.on_ready_callback,
          state.on_player_state_changed_callback
        );
        let original_video_url = state.youtube_player.get_video_url();
        state.recordings[original_video_url] = new Recording(
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
          let shot = new RecordingShot(
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

  function injectYouTubeAPIScript() {
    let script = document.createElement("script");
    script.src = "https://www.youtube.com/player_api";
    let firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
  }

  return {
    state,
    openRecordingShot,
    closeRecordingShot,
    onReadyCallback,
    onPlayerStateChangedCallback,
    loadYoutubeURLOnURLChange,
    loadYouTubeURLOnRecordIdChange,
    injectYouTubeAPIScript,
  };
}

export default useSlSubtitleDesigner;
