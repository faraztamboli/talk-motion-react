import { RemotePy } from './remotepy.1.1.0.min.js';
import { setCookie, getCookie } from './remotepy_utils.js';
var RPy = new RemotePy();


function inside_session(exp_days, callback) {
  // var data = sessionStorage.getItem('JS2PY_SESSION_ID');

  if (typeof exp_days == 'function') {
    callback = exp_days;
    exp_days = 0;
  }

  var data = getCookie('JS2PY_SESSION_ID');
  if (data == null || data == '' ) {
    generateNewSessionId(exp_days, callback);
  }
  else {
    callback(data);
  }
}

function generateNewSessionId(exp_days, callback) {
    RPy.PythonFunctions.SessionServer.getNewSessionId(function(uuid) {
        setCookie('JS2PY_SESSION_ID', uuid, exp_days);
        if (callback !== undefined) {
            callback(uuid);
        }
    });
}


window.onload = function() {
    //JS2Py.serverName = 'wss://localhost:8082';
    RPy.serverName = 'wss://talk-motion.com:8083';
    RPy.start();
}

RPy.onopen = function() {
    divStatus.innerHTML = "Connected";
    inside_session(function(session_id) {
        // Start the session on server
        RPy.PythonFunctions.SessionServer.startSessionIfNotStarted(session_id, function() {
          // HERE: enable login button. this is only after session starts
          // update status that session started
          divStatus.innerHTML = "Session started";
        });

        // Check if user logged in
        RPy.PythonFunctions.SessionServer.isLoggedIn(session_id, function(loginInfo) {
            if(loginInfo.isLoggedIn) {
                // disable/hide login button as you are already logged in
                // enable/display logoff button to give option to logout
                divStatus.innerHTML = "Logged in";
            }
            else {
                // enable/display login button as you are already logged in
                // disable/hide logoff button to give option to logout
                divStatus.innerHTML = "Not logged in";
            }
        });
    });

    document.querySelector('.LoginButton').addEventListener('click', on_login_click);
    document.querySelector('.LogoutButton').addEventListener('click', on_logout_click);
}

RPy.onclose = function() {
    divStatus.innerHTML = 'Connection closed';
}

// Login or logout event handlers
function on_login_click() {
    // Validate the session on the server

    inside_session(function(session_id) {
        let username = document.getElementById('user').value;
        let password = document.getElementById('pass').value;
        let remember = true;
        let currentUrl = 'http://localhost:63344/Projects/test/web/kubloy/index.html', afterLoginUrl = 'http://localhost:63344/Projects/test/web/kubloy/index.html';
        RPy.PythonFunctions.SessionServer.validateLogin(session_id, username, password, remember, currentUrl, afterLoginUrl, function(result) {
            // disable / hide login button
            // enable / display logout button
            // call any function that needs to be called after login
            divStatus.innerHTML = 'Login validated';
        });
    });
}

function on_logout_click() {
    inside_session(function(session_id) {
        RPy.PythonFunctions.SessionServer.logOut(function(result) {
            // enable / display login button
            // disable / hidelogout button
            // call any function that needs to be called after logout
            divStatus.innerHTML = 'Logged out';
        });
    });
}

function get_current_recording() {
    if(state == null || state.youtube_player == null) alert('ERROR');
    let video_code = state.youtube_player.get_video_code();
    let original_recording_url = state.youtube_player.get_video_url();
    return state.recordings[original_recording_url];
}

function load_youtube_url_on_record_id_change() {
    let recording_id = document.getElementById('recording_id');
    inside_session(function(session_id) {
        let with_shots = false;
        if(state.is_recorder) {
            with_shots = true;
        }
        else{
            with_shots = false;
        }
        RPy.PythonFunctions.TalkMotionServer.getVideoRecording(session_id, parseInt(recording_id.value), with_shots, function(result) {
            console.log(result);
            state.youtube_player = new youtube_player('youtube_video_frame', result.original_video_url, state.on_ready_callback, state.on_player_state_changed_callback);
            let original_video_url = state.youtube_player.get_video_url();
            state.recordings[original_video_url] = new recording(result.title, result.description, original_video_url);
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
            for(let i in result.recording_shots) {
                let rshot = result.recording_shots[i];
                let shot = new recording_shot(rshot.session_id, rshot.original_video_start, rshot.recording_start, rshot.js_start);
                shot.close(rshot.shot, rshot.video_url, rshot.chunk_size, rshot.original_video_end, rshot.recording_end, rshot.js_end);
                state.recordings[original_video_url].add_shot(shot);
            }
            if(state.is_recorder) {
                let current_recording = get_current_recording();
                let youtube_url = document.getElementById('youtube_url');
                if (youtube_url!==undefined) {
                    youtube_url.value = state.youtube_player.video_code;
                }
            }
        });
    });
}
function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

async function enterPip(videoElement) {
    if(
        document.pictureInPictureEnabled &&
        !videoElement.disablePictureInPicture) {
            try {
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture();
                }
                await videoElement.requestPictureInPicture();
                videoElement.style.visibility = "hidden";
            } catch(err) {
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

export {RPy, inside_session, generateNewSessionId, on_login_click, on_logout_click, get_current_recording, load_youtube_url_on_record_id_change, hasGetUserMedia, enterPip, exitPip};
