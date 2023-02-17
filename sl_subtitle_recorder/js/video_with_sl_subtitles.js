import { RemotePy } from './remotepy.1.1.0.min.js';
import { setCookie, getCookie } from './remotepy_utils.js';
import { RPy, inside_session, generateNewSessionId, on_login_click, on_logout_click, get_current_recording, load_youtube_url_on_record_id_change, hasGetUserMedia, enterPip, exitPip} from './sl_subtitles.js';

function open_recording_shot(recording_id, original_video_start, recording_start, js_start) {
    // do nothing
}

function close_recording_shot(video_recording_shot_id, chunk_size, original_video_end, recording_end, js_end, shot, active_parts) {
    // do nothing
}

function on_ready_callback(event) {
    //state.camcorder = new camcorder('camera_video', get_current_recording(), state.youtube_player.get_player(), open_recording_shot, close_recording_shot);
    //state.camcorder.recordStream();
    // state.recording_button.is_recording_mode_on()
    if (hasGetUserMedia()) {
        // Good to go!
    } else {
        alert('getUserMedia() is not supported in your browser');
    }
    play_youtube_sl_together();
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

    }
    if (event.data == YT.PlayerState.PAUSED) {
      console.log('paused');
      console.log(state.youtube_player.get_current_play_time());
    }
    if (event.data == YT.PlayerState.BUFFERING) {
      console.log('buffering');
    }
    if (event.data == YT.PlayerState.CUED) {
      console.log('CUED');
    }
}

function play_video(v) {
    const box = document.getElementById('box');

    while (box.lastElementChild) {
        box.removeChild(box.lastElementChild);
    }
    const video = document.createElement('video');
    video.setAttribute("id", "vid"+v.start);
    if (state.in_pip) {
        video.style.visibility = "hidden";
    } else {
        video.style.visibility = "visible";
    }
    video.onloadedmetadata = function() {
        if (state.in_pip) {
            enterPip(video);
        } else {
            exitPip(video);
        }
    };
    video.src = v.url;
    var isPlaying = video.currentTime > 0 && !video.paused && !video.ended
        && video.readyState > video.HAVE_CURRENT_DATA;
    video.controls = true;
    video.muted = false;
    video.height = 390;
    video.width = 640;

    box.appendChild(video);
    if (!isPlaying) {
      //await video.play();
      var playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.then(_ => {
          // Automatic playback started!
          // Show playing UI.
          console.log('Show playing UI');
            if (box !== undefined) {
                box.style.visibility = "visible";
            }
        })
        .catch(error => {
          // Auto-play was prevented
          // Show paused UI.
          console.log('Show paused UI');
        });
      }
    }
}

async function play_youtube_sl_together() {
    let current_recording = get_current_recording();
    let plan = current_recording.get_record_play_plan();
    state.youtube_player.player.playVideo();
    state.youtube_player.player.seekTo(0);
    let previous_player_time = await state.youtube_player.player.playerInfo.currentTime;
    //let skipfirst = true;

    var intervalId = window.setInterval(function(){
      // call your function here
        for (const [key, value] of Object.entries(plan)) {
          // console.log(key, value);
          if(previous_player_time < key && state.youtube_player.player.playerInfo.currentTime > key) {
            console.log(previous_player_time);
            console.log(state.youtube_player.player.playerInfo.currentTime);
            console.log(value.url);
            play_video(value);
          }
        }
        previous_player_time = state.youtube_player.player.playerInfo.currentTime;
        let max_time = Object.keys(plan).reduce((a, b) => plan[a] > plan[b] ? a : b);
//        if (state.youtube_player.player.playerInfo.currentTime > max_time) {
//            clearInterval(intervalId);
//        }
    }, 1);

}

function inject_youtube_api_script() {
      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//    // Inject YouTube API script
//    var tag = document.createElement('script');
//    tag.src = "https://www.youtube.com/player_api";
//    var firstScriptTag = document.getElementsByTagName('script')[0];
//    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

$(function () {
    inject_youtube_api_script();
    //below will come from query string
    let recording_id = document.getElementById('recording_id');
    recording_id.addEventListener("change", function() {
        load_youtube_url_on_record_id_change();
    });
    state.set_is_recorder(false);
    state.set_on_ready_callback(on_ready_callback);
    state.set_on_player_state_changed_callback(on_player_state_changed_callback);
    state.set_in_pip(true);

    let enter_pip = document.getElementById('enter_pip');
    enter_pip.addEventListener("click", function() {
        state.set_in_pip(true);
        //enterPip(document.querySelector('#camera_video')); // specify a class name for video tag here
    });

    let exit_pip = document.getElementById('exit_pip');
    exit_pip.addEventListener("click", function() {
        state.set_in_pip(false);
        //exitPip(undefined);
    });

//    RPy.serverName = 'wss://talk-motion.com:8083';
//    RPy.start();
})
