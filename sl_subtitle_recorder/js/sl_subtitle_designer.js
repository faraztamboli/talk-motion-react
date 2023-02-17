import { RemotePy } from './remotepy.1.1.0.min.js';
import { setCookie, getCookie } from './remotepy_utils.js';
import { RPy, inside_session, generateNewSessionId, on_login_click, on_logout_click, get_current_recording, load_youtube_url_on_record_id_change, hasGetUserMedia, enterPip, exitPip} from './sl_subtitles.js';

function open_recording_shot(recording_id, original_video_start, recording_start, js_start) {
    inside_session(function(session_id) {
        RPy.PythonFunctions.TalkMotionServer.openVideoRecordingShot(session_id, recording_id, original_video_start, recording_start, js_start, function(result) {
            console.log(result);
            //state.recordings[state.youtube_player.get_video_url()].recording_id = result.video_recording_id;
            let current_recording = get_current_recording();
            current_recording.get_active_shot().recording_shot_id = result.video_recording_shot_id;
        });
    });
}

function close_recording_shot(video_recording_shot_id, chunk_size, original_video_end, recording_end, js_end, shot, active_parts) {
    RPy.PythonFunctions.TalkMotionServer.closeVideoRecordingShotWithVideo(video_recording_shot_id, chunk_size, original_video_end, recording_end, js_end,
                             shot, active_parts, function(result) {
        console.log(result);
        let current_recording = get_current_recording();
        current_recording.get_active_shot().set_video_url(result.video_url);
        console.log(current_recording);
    });
}

function on_ready_callback(event) {
    state.camcorder = new camcorder('camera_video', get_current_recording(), state.youtube_player.get_player(), open_recording_shot, close_recording_shot);
    state.camcorder.recordStream();
    // state.recording_button.is_recording_mode_on()
    if (hasGetUserMedia()) {
        // Good to go!
    } else {
        alert('getUserMedia() is not supported in your browser');
    }
}

function on_player_state_changed_callback(event) {
    console.log(event);
    if (event.data == -1) {
      console.log('started');
      console.log(event.target.videoTitle);
    }
    if (event.data == YT.PlayerState.ENDED) {
      console.log('ended');
    }
    if (event.data == YT.PlayerState.PLAYING) {
      console.log('playing');
      console.log(state.youtube_player.get_current_play_time());
      let current_recording = get_current_recording();
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
        RPy.PythonFunctions.TalkMotionServer.updateVideoRecording(
            current_recording.recording_id,
            event.target.playerInfo.videoData.title,
            event.target.playerInfo.videoData.author,
            event.target.playerInfo.videoData.video_quality,
            event.target.playerInfo.duration,
            event.target.playerInfo.currentTimeLastUpdated_,
            event.target.playerInfo.playbackRate,
            event.target.playerInfo.playbackQuality,
            function(result) {
                console.log(result);
            });

      if (state.recording_button.is_recording_mode_on()) {
        state.camcorder.resumeRecording();
      }
    }
    if (event.data == YT.PlayerState.PAUSED) {
      console.log('paused');
      console.log(state.youtube_player.get_current_play_time());
      if (state.recording_button.is_recording_mode_on()) {
        state.camcorder.pauseRecording();
      }
    }
    if (event.data == YT.PlayerState.BUFFERING) {
      console.log('buffering');
    }
    if (event.data == YT.PlayerState.CUED) {
      console.log('CUED');
    }
}

function load_youtube_url_on_url_change() {
    let youtube_url = document.getElementById('youtube_url');
    state.youtube_player = new youtube_player('youtube_video_frame', youtube_url.value, on_ready_callback, on_player_state_changed_callback);
    youtube_url.value = state.youtube_player.get_video_code();
    let recording_title = document.getElementById('recording_title');
    let recording_description = document.getElementById('recording_description');
    if (!(state.youtube_player.get_video_url() in state.recordings)) {
        state.recordings[state.youtube_player.get_video_url()] = new recording(recording_title.value, recording_description.value, state.youtube_player.get_video_url());
        // createVideoRecording: create recording in database and use the returned id to update the state.recordings[state.youtube_player.get_video_url()].recording_id
        RPy.PythonFunctions.TalkMotionServer.createVideoRecording(recording_title.value, recording_description.value, state.youtube_player.get_video_url(), function(result) {
            console.log(result);
            state.recordings[state.youtube_player.get_video_url()].recording_id = result.video_recording_id;
        });
    }
}

function inject_youtube_api_script() {
    // Inject YouTube API script
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/player_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

$(function () {
    inject_youtube_api_script();
    //below will come from query string
    let recording_id = document.getElementById('recording_id');
    recording_id.addEventListener("change", function() {
        load_youtube_url_on_record_id_change();
    });
    state.set_is_recorder(true);
    state.set_on_ready_callback(on_ready_callback);
    state.set_on_player_state_changed_callback(on_player_state_changed_callback);
    state.set_in_pip(false);
    state.recording_button = new recording_button('recButton', state);
    let youtube_url = document.getElementById('youtube_url');
    youtube_url.addEventListener("change", function() {
        load_youtube_url_on_url_change();
    });
})
