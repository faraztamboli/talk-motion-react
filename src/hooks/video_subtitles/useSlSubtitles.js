import JS2Py from "../../remotepyjs";
import useLocalStorage from "../useLocalStorage";

// Helper function to convert embed URL to watch URL for display
function convertEmbedToWatchURL(embedURL) {
  if (!embedURL) return embedURL;
  
  // Extract video code from embed URL
  const embedMatch = embedURL.match(/embed\/([^\?]+)/);
  if (embedMatch && embedMatch[1]) {
    return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
  }
  
  // If already a watch URL or other format, return as is
  return embedURL;
}

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

  function loadYouTubeURLOnRecordIdChange(recordingId, onDataLoaded) {
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
        
        // Call the callback immediately with the data so React can render the iframe
        // This ensures the iframe exists before we try to create the player
        // Convert embed URL to watch URL for better display in input field
        const displayURL = convertEmbedToWatchURL(result.original_video_url);
        if (onDataLoaded && typeof onDataLoaded === 'function') {
          onDataLoaded({
            title: result.title || '',
            description: result.description || '',
            youtubeURL: displayURL || result.original_video_url,
            recordingId: result.id
          });
        }
        
        // Wait for iframe to exist before creating player (fixes null reference error)
        let retryCount = 0;
        const maxRetries = 50; // 50 * 100ms = 5 seconds max wait
        
        const createYouTubePlayer = () => {
          const iframe = document.getElementById("youtube_video_frame");
          if (iframe) {
            // eslint-disable-next-line
            state.youtube_player = new youtube_player(
              "youtube_video_frame",
              result.original_video_url,
              // eslint-disable-next-line
              state.on_ready_callback,
              // eslint-disable-next-line
              state.on_player_state_changed_callback
            );
            
            // Check if player was created successfully (video_frame might be null)
            // eslint-disable-next-line
            if (!state.youtube_player || !state.youtube_player.video_frame) {
              console.error("Failed to create YouTube player - iframe not found");
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createYouTubePlayer, 100);
              }
              return;
            }
            
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
              if (youtube_url !== null && youtube_url !== undefined) {
                // eslint-disable-next-line
                youtube_url.value = state.youtube_player.video_code;
              }
            }
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(createYouTubePlayer, 100);
          } else {
            console.error("YouTube iframe not found after max retries. Make sure the iframe is rendered in the DOM.");
          }
        };
        
        // Give React a moment to render the iframe after the callback
        setTimeout(createYouTubePlayer, 100);
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
