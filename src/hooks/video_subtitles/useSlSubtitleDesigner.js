import useLocalStorage from "../useLocalStorage";
import JS2Py from "../../remotepyjs";
import useSlSubtitles from "./useSlSubtitles";
import truncateString from "../../utils/truncateString";
// camcorder is loaded via script tag in index.html, available as window.camcorder
// eslint-disable-next-line
const camcorder = typeof window !== 'undefined' ? window.camcorder : null;

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
    // If recording_id is not available yet, wait for it and retry
    if (!recordingId) {
      console.warn("⚠️ Recording ID not available yet, waiting for it...");
      let current_recording = getCurrentRecording();
      
      // Retry up to 50 times (5 seconds) waiting for recording_id
      let retryCount = 0;
      const maxRetries = 50;
      const retryInterval = setInterval(() => {
        retryCount++;
        current_recording = getCurrentRecording();
        const newRecordingId = current_recording ? current_recording.recording_id : null;
        
        if (newRecordingId) {
          console.log("✅ Recording ID now available:", newRecordingId, "retrying openRecordingShot...");
          clearInterval(retryInterval);
          // Retry with the new recording ID
          openRecordingShot(newRecordingId, originalVideoStart, recordingStart, jsStart);
        } else if (retryCount >= maxRetries) {
          console.error("❌ Cannot open recording shot: recording_id is still missing after", maxRetries * 100, "ms");
          console.error("   This usually means createVideoRecording failed or hasn't completed yet");
          clearInterval(retryInterval);
        } else if (retryCount % 10 === 0) {
          console.log(`   Still waiting for recording_id... (${retryCount}/${maxRetries})`);
        }
      }, 100);
      
      return;
    }
    console.log("=== Opening recording shot ===");
    console.log("Recording ID:", recordingId, "original_video_start:", originalVideoStart, "js_start:", jsStart);
    
    // Get the current recording and find the shot that matches these parameters
    // This ensures we set the ID on the correct shot, even if new shots are created
    let current_recording = getCurrentRecording();
    let target_shot = null;
    
    // Find the shot that matches these parameters (most recent shot with matching start time)
    // We match by original_video_start (with tolerance for float precision) and exact js_start
    // Use tolerance of 0.05 seconds for original_video_start to handle floating-point precision issues
    const TIME_TOLERANCE = 0.05;
    for (let i = current_recording.recording_shots.length - 1; i >= 0; i--) {
      let shot = current_recording.recording_shots[i];
      const timeDiff = Math.abs(shot.original_video_start - originalVideoStart);
      if (timeDiff < TIME_TOLERANCE && 
          shot.js_start === jsStart &&
          (shot.recording_shot_id === null || shot.recording_shot_id === undefined)) {
        target_shot = shot;
        break;
      }
    }
    
    // If no matching shot found, use the active shot (fallback)
    if (!target_shot) {
      target_shot = current_recording.get_active_shot();
      console.warn("No matching shot found by parameters, using active shot:", target_shot);
    }
    
    if (!target_shot) {
      console.error("ERROR: No shot found to set ID on!");
      return;
    }
    
    console.log("Target shot for ID assignment:", {
      original_video_start: target_shot.original_video_start,
      js_start: target_shot.js_start,
      current_id: target_shot.recording_shot_id
    });
    
    JS2Py.PythonFunctions.TalkMotionServer.openVideoRecordingShot(
      token,
      recordingId,
      originalVideoStart,
      recordingStart,
      jsStart,
      function (result) {
        console.log("=== openVideoRecordingShot callback received ===");
        console.log("Result:", result);
        if (!result || !result.video_recording_shot_id) {
          console.error("ERROR: openVideoRecordingShot did not return a valid shot ID!");
          console.error("Result:", result);
          return;
        }
        
        // Find the shot again to ensure we're setting it on the right one
        // (in case a new shot was created between the call and callback)
        let current_recording = getCurrentRecording();
        let matching_shot = null;
        
        // Try to find the shot by matching parameters (with tolerance for float precision)
        const TIME_TOLERANCE = 0.05;
        for (let i = current_recording.recording_shots.length - 1; i >= 0; i--) {
          let shot = current_recording.recording_shots[i];
          const timeDiff = Math.abs(shot.original_video_start - originalVideoStart);
          if (timeDiff < TIME_TOLERANCE && 
              shot.js_start === jsStart &&
              (shot.recording_shot_id === null || shot.recording_shot_id === undefined)) {
            matching_shot = shot;
            break;
          }
        }
        
        // If still no match, try to find by checking if the target_shot still exists
        if (!matching_shot) {
          // Check if target_shot is still in the array and doesn't have an ID yet
          for (let i = 0; i < current_recording.recording_shots.length; i++) {
            if (current_recording.recording_shots[i] === target_shot && 
                !target_shot.recording_shot_id) {
              matching_shot = target_shot;
              break;
            }
          }
        }
        
        // Final fallback: use active shot if it doesn't have an ID
        if (!matching_shot) {
          let active_shot = current_recording.get_active_shot();
          if (active_shot && (!active_shot.recording_shot_id || active_shot.recording_shot_id === null)) {
            matching_shot = active_shot;
            console.warn("Using active shot as fallback for ID assignment");
          }
        }
        
        if (!matching_shot) {
          console.error("ERROR: Could not find shot to set ID on! All shots may already have IDs.");
          console.error("All shots:", current_recording.recording_shots.map(s => ({
            start: s.original_video_start,
            js_start: s.js_start,
            id: s.recording_shot_id
          })));
          return;
        }
        
        console.log("Setting shot ID:", result.video_recording_shot_id, "on shot:", {
          original_video_start: matching_shot.original_video_start,
          js_start: matching_shot.js_start,
          previous_id: matching_shot.recording_shot_id
        });
        matching_shot.recording_shot_id = result.video_recording_shot_id;
        console.log("✅ Shot ID set successfully. Shot now has ID:", matching_shot.recording_shot_id);
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
    // NOTE: This function is kept for backward compatibility but is no longer used
    // UploadManager now handles all uploads via chunked upload API
    // The finalizeVideoRecordingShotUpload call in UploadManager replaces this
    console.log("=== closeRecordingShot called (legacy - UploadManager handles uploads now) ===");
    console.log("This function is deprecated. UploadManager handles all uploads via chunked API.");
  }

  function onReadyCallback(event) {
    console.log(event);

    // Check if camcorder is available - try window.camcorder directly
    const camcorderClass = typeof window !== 'undefined' ? window.camcorder : null;
    if (!camcorderClass || typeof camcorderClass !== 'function') {
      console.error("❌ camcorder is not available. window.camcorder:", camcorderClass);
      console.error("   Waiting for camcorder script to load...");
      // Try again after a short delay
      setTimeout(() => {
        const retryCamcorder = typeof window !== 'undefined' ? window.camcorder : null;
        if (retryCamcorder && typeof retryCamcorder === 'function') {
          console.log("✅ camcorder loaded, creating instance...");
          // eslint-disable-next-line
          state.camcorder = new retryCamcorder(
            "camera_video",
            getCurrentRecording(),
            // eslint-disable-next-line
            state.youtube_player.get_player(),
            openRecordingShot,
            closeRecordingShot,
            token
          );
          // Continue with recordStream
          // eslint-disable-next-line
          state.camcorder.recordStream().then(() => {
            console.log("Stream ready - recording will start when button is clicked and video is playing");
          }).catch(err => {
            console.error("Error getting stream:", err);
          });
        } else {
          console.error("❌ camcorder still not available after delay. Make sure /video_subtitles_classes/camcorder.js is loaded.");
        }
      }, 500);
      return;
    }

    // Use window.camcorder directly to ensure we have the latest reference
    const CamcorderClass = typeof window !== 'undefined' ? window.camcorder : camcorder;
    // eslint-disable-next-line
    state.camcorder = new CamcorderClass(
      "camera_video",
      getCurrentRecording(),
      // eslint-disable-next-line
      state.youtube_player.get_player(),
      openRecordingShot,
      closeRecordingShot,
      token
    );

    // eslint-disable-next-line
    state.camcorder.recordStream().then(() => {
      console.log("Stream ready - recording will start when button is clicked and video is playing");
      // DO NOT auto-start recording - wait for user to click the recording button
      // Recording will start when:
      // 1. User clicks the recording button (enables recording mode)
      // 2. YouTube video is playing (checked in onPlayerStateChangedCallback)
    }).catch(err => {
      console.error("Error getting stream:", err);
    });
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
      console.log("=== Video ended ===");
      // eslint-disable-next-line
      if (state.recording_button && state.recording_button.is_recording_mode_on()) {
        console.log("Video ended while recording - stopping recorder to finalize and close the last shot");
        // eslint-disable-next-line
        let current_recording = getCurrentRecording();
        // eslint-disable-next-line
        let active_shot = current_recording ? current_recording.get_active_shot() : null;
        // eslint-disable-next-line
        console.log("Active shot before stopping:", active_shot ? {
          id: active_shot.recording_shot_id, 
          start: active_shot.original_video_start,
          js_start: active_shot.js_start
        } : "none");
        
        // Store the active shot's parameters to track it
        let target_shot_start = active_shot ? active_shot.original_video_start : null;
        let target_shot_js_start = active_shot ? active_shot.js_start : null;
        
        // Stop the recording to finalize all data using settle-window approach
        // eslint-disable-next-line
        if (state.camcorder && state.camcorder.recorder) {
          const recorderState = state.camcorder.recorder.state;
          console.log("Video ended - finalizing last segment, recorder state:", recorderState);
          // eslint-disable-next-line
          const original_video_end = state.camcorder.player.playerInfo.currentTime;
          const js_end = Date.now();
          // Capture chunks and recorder before finalizing (in case new session starts)
          // eslint-disable-next-line
          const recorderToFinalize = state.camcorder.recorder;
          // eslint-disable-next-line
          const chunksToFinalize = state.camcorder.chunks;
          // eslint-disable-next-line
          const mimeTypeToUse = recorderToFinalize.mimeType || state.camcorder.recorderMimeType || "video/webm";
          console.log("🔵 [DEBUG] Capturing chunks and recorder for finalization...");
          console.log("   state.camcorder exists:", !!state.camcorder);
          console.log("   state.camcorder.recorder exists:", !!state.camcorder.recorder);
          console.log("   state.camcorder.recorder === recorderToFinalize:", state.camcorder.recorder === recorderToFinalize);
          console.log("   state.camcorder.chunks exists:", !!state.camcorder.chunks);
          console.log("   state.camcorder.chunks type:", Array.isArray(state.camcorder.chunks) ? 'array' : typeof state.camcorder.chunks);
          console.log("   state.camcorder.chunks length:", state.camcorder.chunks ? state.camcorder.chunks.length : 'N/A');
          console.log("   recorderToFinalize exists:", !!recorderToFinalize);
          console.log("   recorderToFinalize state:", recorderToFinalize?.state);
          console.log("   recorderToFinalize.onstop handler preview:", recorderToFinalize?.onstop?.toString().substring(0, 150));
          console.log("   recorderToFinalize.onstop is function:", typeof recorderToFinalize?.onstop === 'function');
          console.log("Finalizing with captured chunks:", chunksToFinalize ? chunksToFinalize.length : 0);
          
          // Try to call the method - check prototype chain
          // eslint-disable-next-line
          if (state.camcorder) {
            // Try multiple ways to access the method - always bind to ensure 'this' context
            let method = null;
            if (typeof state.camcorder.stopAndProcessCurrentSegmentWithChunks === 'function') {
              // Method found on instance - bind it to ensure correct 'this' context
              method = state.camcorder.stopAndProcessCurrentSegmentWithChunks.bind(state.camcorder);
            } else if (state.camcorder.constructor && typeof state.camcorder.constructor.prototype.stopAndProcessCurrentSegmentWithChunks === 'function') {
              method = state.camcorder.constructor.prototype.stopAndProcessCurrentSegmentWithChunks.bind(state.camcorder);
            } else if (state.camcorder.__proto__ && typeof state.camcorder.__proto__.stopAndProcessCurrentSegmentWithChunks === 'function') {
              method = state.camcorder.__proto__.stopAndProcessCurrentSegmentWithChunks.bind(state.camcorder);
            }
            
            if (method) {
              try {
                console.log("Calling stopAndProcessCurrentSegmentWithChunks (bound to camcorder instance)...");
                const result = method(recorderToFinalize, chunksToFinalize, mimeTypeToUse, original_video_end, js_end);
                // Handle async method
                if (result && typeof result.then === 'function') {
                  result.then(() => {
                    console.log("stopAndProcessCurrentSegmentWithChunks() completed - blob will be finalized with settle window");
                  }).catch((err) => {
                    console.error("Error in stopAndProcessCurrentSegmentWithChunks:", err);
                  });
                } else {
                  console.log("stopAndProcessCurrentSegmentWithChunks() called");
                }
              } catch (e) {
                console.error("Error calling stopAndProcessCurrentSegmentWithChunks:", e);
                console.error("Error details:", e.message, e.stack);
                // Fallback: just stop the recorder
                if (recorderToFinalize && recorderToFinalize.state !== 'inactive') {
                  try {
                    console.log("Stopping recorder as fallback...");
                    recorderToFinalize.stop();
                  } catch (stopErr) {
                    console.error("Error stopping recorder:", stopErr);
                  }
                }
              }
            } else {
              console.error("stopAndProcessCurrentSegmentWithChunks method not found on camcorder");
              console.error("Camcorder type:", typeof state.camcorder);
              console.error("Camcorder constructor:", state.camcorder?.constructor?.name);
              console.error("Has __proto__:", !!state.camcorder.__proto__);
              
              // Debug: Check what methods are actually available
              if (state.camcorder.constructor && state.camcorder.constructor.prototype) {
                const protoMethods = Object.getOwnPropertyNames(state.camcorder.constructor.prototype)
                  .filter(name => typeof state.camcorder.constructor.prototype[name] === 'function' && name !== 'constructor');
                console.error("Prototype methods:", protoMethods);
              }
              
              // Try to access via global camcorder class if available
              if (typeof window !== 'undefined' && window.camcorder) {
                console.log("Found camcorder class on window, trying to access method...");
                const CamcorderClass = window.camcorder;
                if (CamcorderClass.prototype && typeof CamcorderClass.prototype.stopAndProcessCurrentSegmentWithChunks === 'function') {
                  console.log("Found method on window.camcorder.prototype, binding and calling...");
                  const boundMethod = CamcorderClass.prototype.stopAndProcessCurrentSegmentWithChunks.bind(state.camcorder);
                  try {
                    const result = boundMethod(recorderToFinalize, chunksToFinalize, mimeTypeToUse, original_video_end, js_end);
                    if (result && typeof result.then === 'function') {
                      result.then(() => {
                        console.log("stopAndProcessCurrentSegmentWithChunks() completed via window.camcorder");
                      }).catch((err) => {
                        console.error("Error in stopAndProcessCurrentSegmentWithChunks:", err);
                      });
                    }
                    return; // Success, exit early
                  } catch (e) {
                    console.error("Error calling via window.camcorder:", e);
                  }
                }
              }
              
              // Fallback: The method isn't accessible, but the onstop handler should process it
              // The recorder's onstop will call _record_blob_base64 which uses UploadManager
              if (recorderToFinalize && recorderToFinalize.state !== 'inactive') {
                try {
                  console.log("🔵 [DEBUG] Stopping recorder - onstop handler will process blob with UploadManager...");
                  console.log("   Recorder state before stop:", recorderToFinalize.state);
                  console.log("   onstop handler attached:", typeof recorderToFinalize.onstop === 'function');
                  console.log("   onstop handler:", recorderToFinalize.onstop);
                  console.log("   chunks available:", chunksToFinalize ? chunksToFinalize.length : 'N/A');
                  console.log("   _record_blob_base64 available:", typeof state.camcorder?._record_blob_base64 === 'function');
                  console.log("   state.camcorder.chunks:", state.camcorder?.chunks ? state.camcorder.chunks.length : 'N/A');
                  
                  // Store reference to onstop handler before stopping
                  const onstopHandler = recorderToFinalize.onstop;
                  console.log("   onstop handler function preview:", onstopHandler?.toString().substring(0, 150));
                  
                  recorderToFinalize.stop();
                  console.log("   ✅ recorder.stop() called, new state:", recorderToFinalize.state);
                  console.log("   Waiting for onstop event to fire...");
                  
                  // Check if handler is our complex handler or a simple one
                  const handlerIsOurs = onstopHandler && onstopHandler.toString().includes('_record_blob_base64');
                  console.log("   Handler is our complex handler:", handlerIsOurs);
                  
                  // If onstop handler didn't fire after a short delay, manually trigger it
                  setTimeout(() => {
                    if (recorderToFinalize.state === 'inactive') {
                      if (handlerIsOurs && onstopHandler && typeof onstopHandler === 'function') {
                        console.log("   ⚠️ onstop handler didn't fire automatically, manually triggering our handler...");
                        try {
                          onstopHandler({ target: recorderToFinalize, type: 'stop' });
                        } catch (err) {
                          console.error("   ❌ Error manually triggering onstop:", err);
                        }
                      } else {
                        console.warn("   ⚠️ onstop handler is not our complex handler, attempting direct blob processing");
                        console.warn("   Handler preview:", onstopHandler?.toString().substring(0, 200));
                        
                        // Try to access _record_blob_base64 directly and process blob
                        // First, try to get chunks from camcorder - check multiple possible locations
                        let chunksToProcess = null;
                        if (state.camcorder?.chunks && state.camcorder.chunks.length > 0) {
                          chunksToProcess = state.camcorder.chunks;
                          console.log("   ✅ Found chunks in state.camcorder.chunks:", chunksToProcess.length);
                        } else if (chunksToFinalize && chunksToFinalize.length > 0) {
                          chunksToProcess = chunksToFinalize;
                          console.log("   ✅ Found chunks in chunksToFinalize:", chunksToProcess.length);
                        } else {
                          console.warn("   ⚠️ No chunks found in either location");
                          console.warn("      state.camcorder.chunks:", state.camcorder?.chunks ? state.camcorder.chunks.length : 'undefined');
                          console.warn("      chunksToFinalize:", chunksToFinalize ? chunksToFinalize.length : 'undefined');
                        }
                        
                        console.log("   🔍 Chunks to process:", chunksToProcess ? chunksToProcess.length : 'N/A');
                        console.log("   🔍 _record_blob_base64 available:", typeof state.camcorder?._record_blob_base64 === 'function');
                        console.log("   🔍 finalizeWebM available:", typeof state.camcorder?.finalizeWebM === 'function');
                        console.log("   🔍 validateWebMHeader available:", typeof state.camcorder?.validateWebMHeader === 'function');
                        
                        if (state.camcorder?._record_blob_base64 && chunksToProcess && chunksToProcess.length > 0) {
                          console.log("   🔄 Attempting direct blob processing via _record_blob_base64...");
                          console.log("   Chunks array length:", chunksToProcess.length);
                          state.camcorder.finalizeWebM(recorderToFinalize, chunksToProcess, { settleMs: 1000, maxMs: 10000 })
                            .then(async ({ blob, mimeType: finalMimeType }) => {
                              console.log("   ✅ finalizeWebM completed, blob size:", blob.size);
                              const ok = await state.camcorder.validateWebMHeader(blob);
                              if (ok) {
                                console.log("   ✅ Blob validation passed, calling _record_blob_base64...");
                                const original_video_end = state.camcorder.player.playerInfo.currentTime;
                                const js_end = Date.now();
                                const recorderId = Date.now() + Math.random();
                                state.camcorder._record_blob_base64(original_video_end, js_end, recorderId, blob, finalMimeType);
                              } else {
                                console.error("   ❌ Blob validation failed");
                              }
                            })
                            .catch(err => {
                              console.error("   ❌ Error in direct blob processing:", err);
                              console.error("   Error details:", err.message, err.stack);
                            });
                        } else {
                          console.error("   ❌ Cannot process blob - missing requirements:");
                          console.error("      _record_blob_base64:", typeof state.camcorder?._record_blob_base64);
                          console.error("      chunks:", chunksToProcess ? chunksToProcess.length : 'N/A');
                          console.error("      finalizeWebM:", typeof state.camcorder?.finalizeWebM);
                        }
                      }
                    }
                  }, 100);
                  // The onstop handler in startNewRecordingSession will call _record_blob_base64
                  // which should trigger the new UploadManager path
                } catch (stopErr) {
                  console.error("❌ Error stopping recorder:", stopErr);
                }
              } else if (recorderToFinalize && recorderToFinalize.state === 'inactive') {
                // Recorder already stopped - check if _record_blob_base64 was called
                console.log("🔵 [DEBUG] Recorder already inactive - checking if blob processing started...");
                console.log("   onstop handler attached:", typeof recorderToFinalize.onstop === 'function');
                console.log("   chunks available:", chunksToFinalize ? chunksToFinalize.length : 'N/A');
                console.log("   _record_blob_base64 available:", typeof state.camcorder?._record_blob_base64 === 'function');
                // The onstop should have already fired and called _record_blob_base64
              }
            }
          } else {
            console.error("state.camcorder is null or undefined");
          }
          
          // Wait for the shot ID to be set and then for the shot to be closed
          // This is important because the shot might have been just created and the ID callback hasn't executed yet
          let checkCount = 0;
          const maxChecks = 250; // 25 seconds max wait (increased to allow for shot ID callback)
          const checkInterval = setInterval(() => {
            checkCount++;
            // eslint-disable-next-line
            let current_recording = getCurrentRecording();
            // eslint-disable-next-line
            let current_shot = current_recording ? current_recording.get_active_shot() : null;
            // eslint-disable-next-line
            let isStillRecording = state.recording_button && state.recording_button.is_recording_mode_on();
            // eslint-disable-next-line
            let recorderInactive = state.camcorder.recorder && state.camcorder.recorder.state === 'inactive';
            
            // Check if the target shot has an ID now
            let shotHasId = false;
            if (current_shot && target_shot_start !== null && target_shot_js_start !== null) {
              // Try to find the shot by matching parameters
              for (let i = current_recording.recording_shots.length - 1; i >= 0; i--) {
                let shot = current_recording.recording_shots[i];
                if (shot.original_video_start === target_shot_start && 
                    shot.js_start === target_shot_js_start) {
                  shotHasId = shot.recording_shot_id !== null && shot.recording_shot_id !== undefined;
                  break;
                }
              }
            }
            
            // Log progress every 50 checks
            if (checkCount % 50 === 0) {
              console.log(`Waiting for shot to close... (${checkCount}/${maxChecks}) - Shot has ID: ${shotHasId}, Recorder inactive: ${recorderInactive}, Still recording: ${isStillRecording}`);
            }
            
            // If recording button is off, recorder is inactive, and we've waited a bit for blob processing
            // We need to wait longer because blob processing takes time (1500ms initial delay + up to 6 seconds of checks)
            if (!isStillRecording && recorderInactive && checkCount >= 30) {
              // Check if the shot has been closed (has video_url or original_video_end)
              // Also check if closeRecordingShot was called (by checking if there's a response)
              let shotClosed = false;
              if (current_shot && target_shot_start !== null && target_shot_js_start !== null) {
                for (let i = current_recording.recording_shots.length - 1; i >= 0; i--) {
                  let shot = current_recording.recording_shots[i];
                  if (shot.original_video_start === target_shot_start && 
                      shot.js_start === target_shot_js_start) {
                    shotClosed = shot.original_video_end !== null && shot.original_video_end !== undefined;
                    break;
                  }
                }
              }
              
              // Wait longer for blob processing (up to 10 seconds = 100 checks)
              // The onstop handler takes 1500ms initial delay + up to 6 seconds of checks = ~7.5 seconds max
              if (shotClosed || checkCount >= maxChecks) {
                console.log("Shot closing process complete or timeout reached. Stopping stream.");
                clearInterval(checkInterval);
                // Stop media stream tracks after a delay to ensure blob processing completes
                setTimeout(() => {
                  if (state.camcorder) {
                    console.log("Stopping media stream tracks");
                    state.camcorder.stopRecording(); // Stop media stream tracks
                  }
                }, 3000); // Increased from 2 to 3 seconds to ensure blob processing completes
              }
            } else if (checkCount >= maxChecks) {
              console.warn("Timeout waiting for shot to close, stopping stream anyway");
              clearInterval(checkInterval);
              if (state.camcorder) {
                state.camcorder.stopRecording();
              }
            }
          }, 100);
        } else {
          console.warn("No recorder available to stop when video ended");
        }
        
        // Toggle recording button state manually
        // eslint-disable-next-line
        if (state.recording_button && state.recording_button.button) {
          // eslint-disable-next-line
          state.recording_button.button.classList.remove("Rec");
          // eslint-disable-next-line
          state.recording_button.button.classList.add("notRec");
        }
      }
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
      // Use custom title/description if set, otherwise use YouTube video title
      const titleToUse = current_recording.title || truncateString(event.target.playerInfo.videoData.title);
      const descriptionToUse = current_recording.description || "";
      if (current_recording.recording_id) {
        JS2Py.PythonFunctions.TalkMotionServer.updateVideoRecording(
          token,
          current_recording.recording_id,
          truncateString(titleToUse),
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
      }

      // eslint-disable-next-line
      if (state.recording_button && state.recording_button.is_recording_mode_on()) {
        console.log("🎬 Video playing and button is enabled - calling resumeRecording()");
        // Resume the recording (recorder should be in 'paused' state)
        // eslint-disable-next-line
        state.camcorder.resumeRecording();
      } else {
        console.log("🎬 Video playing but button is not enabled. Button:", state.recording_button, "isEnabled:", state.recording_button?.is_recording_mode_on());
      }
    }
    // eslint-disable-next-line
    if (event.data == YT.PlayerState.PAUSED) {
      console.log("paused");
      // eslint-disable-next-line
      console.log(state.youtube_player.get_current_play_time());
      // eslint-disable-next-line
      if (state.recording_button && state.recording_button.is_recording_mode_on()) {
        // Just pause the recording - don't process blob yet
        // Blob will be processed when recording is STOPPED (onstop event)
        // This ensures the blob is complete before processing
        // eslint-disable-next-line
        console.log("🔵 [DEBUG] About to call pauseRecording()...");
        console.log("   camcorder exists:", !!state.camcorder);
        console.log("   pauseRecording exists:", typeof state.camcorder?.pauseRecording);
        if (state.camcorder && typeof state.camcorder.pauseRecording === 'function') {
          try {
            state.camcorder.pauseRecording();
            console.log("   ✅ pauseRecording() called successfully");
          } catch (err) {
            console.error("   ❌ Error calling pauseRecording():", err);
          }
        } else {
          console.error("   ❌ pauseRecording() not available!");
        }
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
    // Ensure iframe exists before creating player
    let retryCount = 0;
    const maxRetries = 50; // 50 * 100ms = 5 seconds max wait
    
    const createYouTubePlayer = () => {
      const iframe = document.getElementById("youtube_video_frame");
      if (iframe) {
        // eslint-disable-next-line
        state.youtube_player = new youtube_player(
          "youtube_video_frame",
          youTubeURL,
          onReadyCallback,
          onPlayerStateChangedCallback
        );
        
        // Check if player was created successfully (video_frame might be null)
        // eslint-disable-next-line
        if (!state.youtube_player || !state.youtube_player.video_frame) {
          console.error("Failed to create YouTube player - iframe not found");
          return;
        }
        
        // TODO: update the youTubeURL
        // eslint-disable-next-line
        youTubeURL = state.youtube_player.get_video_code();
        // eslint-disable-next-line
        console.log(state.youtube_player.get_video_url());

        // Continue with the rest of the function after player is created
        // eslint-disable-next-line
        let video_url = state.youtube_player.get_video_url();
        // eslint-disable-next-line
        let existingRecording = state.recordings[video_url];
        // eslint-disable-next-line
        let recordingId = existingRecording ? existingRecording.recording_id : null;

        // eslint-disable-next-line
        if (!(video_url in state.recordings)) {
          // eslint-disable-next-line
          state.recordings[video_url] = new recording(
            title,
            description,
            video_url,
            recordingId
          );
        } else {
          // Update existing recording with new title and description
          // eslint-disable-next-line
          state.recordings[video_url].title = title;
          // eslint-disable-next-line
          state.recordings[video_url].description = description;
        }

        // If recording already exists (has an ID), update it instead of creating a new one
        if (recordingId !== null && recordingId !== undefined) {
          JS2Py.PythonFunctions.TalkMotionServer.updateVideoRecording(
            token,
            recordingId,
            truncateString(title),
            null, // author - keep existing
            null, // video_quality - keep existing
            null, // duration - keep existing
            null, // currentTimeLastUpdated_ - keep existing
            null, // playbackRate - keep existing
            null, // playbackQuality - keep existing
            function (result) {
              console.log("Updated recording:", result);
            }
          );
        } else {
          // Only create a new recording if one doesn't exist
          JS2Py.PythonFunctions.TalkMotionServer.createVideoRecording(
            token,
            truncateString(title),
            description,
            video_url,
            function (result) {
              console.log(result);

              // eslint-disable-next-line
              state.recordings[video_url].recording_id =
                result.video_recording_id;
            }
          );
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(createYouTubePlayer, 100);
      } else {
        console.error("YouTube iframe not found after max retries. Make sure the iframe is rendered in the DOM.");
      }
    };
    
    createYouTubePlayer();
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

  }

  function initializeRecordingStateVariable() {
    console.log("🔴 Initializing recording button state...");
    // eslint-disable-next-line
    const recordingButtonClass = typeof window !== 'undefined' ? window.recording_button : null;
    if (!recordingButtonClass) {
      console.error("❌ recording_button class not available. Make sure recordingButton.js is loaded.");
      return;
    }
    // eslint-disable-next-line
    state.recording_button = new recordingButtonClass("recButton", state);
    console.log("✅ Recording button initialized:", state.recording_button);
    // eslint-disable-next-line
    state.set_is_recorder(true);
    // eslint-disable-next-line
    state.set_on_ready_callback(onReadyCallback);
    // eslint-disable-next-line
    state.set_on_player_state_changed_callback(onPlayerStateChangedCallback);
    // eslint-disable-next-line
    state.set_in_pip(false);
  }

  function updateRecordingTitleAndDescription(title, description) {
    try {
      let current_recording = getCurrentRecording();
      if (current_recording && current_recording.recording_id) {
        // Update the recording object
        // eslint-disable-next-line
        current_recording.title = title;
        // eslint-disable-next-line
        current_recording.description = description;
        
        // Update in database
        JS2Py.PythonFunctions.TalkMotionServer.updateVideoRecording(
          token,
          current_recording.recording_id,
          truncateString(title),
          null, // author - keep existing
          null, // video_quality - keep existing
          null, // duration - keep existing
          null, // currentTimeLastUpdated_ - keep existing
          null, // playbackRate - keep existing
          null, // playbackQuality - keep existing
          function (result) {
            console.log("Updated recording title/description:", result);
          }
        );
      }
    } catch (error) {
      console.error("Error updating recording title/description:", error);
    }
  }

  injectYouTubeAPIScript();

  return {
    injectYouTubeAPIScript,
    loadYoutubeURLOnURLChange,
    loadYouTubeURLOnRecordIdChange,
    onReadyCallback,
    onPlayerStateChangedCallback,
    initializeRecordingStateVariable,
    updateRecordingTitleAndDescription,
  };
}

export default useSlSubtitleDesigner;
