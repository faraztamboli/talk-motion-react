// UploadManager loader - tries multiple strategies to load UploadManager
let uploadManagerPromise = null;
let uploadManagerInstance = null;

async function getUploadManager() {
  // If already loaded, return it
  if (uploadManagerInstance) {
    return uploadManagerInstance;
  }
  
  if (!uploadManagerPromise) {
    uploadManagerPromise = (async () => {
      try {
        // Strategy 1: Try ES6 dynamic import (works if bundled)
        const module = await import('../../utils/UploadManager');
        uploadManagerInstance = module.uploadManager || new module.UploadManager();
        console.log('✅ UploadManager loaded via ES6 import');
        return uploadManagerInstance;
      } catch (e1) {
        console.warn('⚠️ ES6 import failed, trying window.UploadManager:', e1);
        try {
          // Strategy 2: Check if UploadManager is available globally
          if (typeof window !== 'undefined' && window.UploadManager) {
            uploadManagerInstance = new window.UploadManager();
            console.log('✅ UploadManager loaded from window.UploadManager');
            return uploadManagerInstance;
          }
        } catch (e2) {
          console.error('❌ Failed to load UploadManager from window:', e2);
        }
        
        // Strategy 3: Try loading from a script tag (if available)
        if (typeof window !== 'undefined' && window.uploadManager) {
          uploadManagerInstance = window.uploadManager;
          console.log('✅ UploadManager loaded from window.uploadManager');
          return uploadManagerInstance;
        }
        
        throw new Error('UploadManager not available via any method');
      }
    })();
  }
  return uploadManagerPromise;
}

// eslint-disable-next-line
class camcorder {
  constructor(
    id_camera_video,
    recording,
    player,
    open_recording_shot,
    close_recording_shot,
    token
  ) {
    this.id = id_camera_video;
    this.recorder = null;
    this.pendingRecorders = []; // Track recorders that are still processing blobs
    this.camera_video = document.getElementById(this.id);
    this.mediaConstraints = {
      video: {
        width: 640,
        height: 390,
      },
      /*audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
          },*/
    };
    this.recording = recording;
    this.player = player;
    this.open_recording_shot = open_recording_shot;
    this.close_recording_shot = close_recording_shot;
    this.token = token;
  }

  // Lightweight WebM header validation (EBML header: 1A 45 DF A3)
  async validateWebMHeader(blob) {
    try {
      const buf = await blob.slice(0, 4).arrayBuffer();
      const b = new Uint8Array(buf);
      const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
      if (!isValid) {
        console.error("WebM header validation failed - blob may not be a valid WebM file");
        console.error("First 4 bytes:", Array.from(b).map(x => '0x' + x.toString(16).padStart(2, '0')).join(' '));
      } else {
        console.log("✅ WebM header validation passed");
      }
      return isValid;
    } catch (error) {
      console.error("Error validating WebM header:", error);
      return false;
    }
  }

  // Settle-window blob finalization - wait for dataavailable to be idle after stop
  // IMPORTANT: This does NOT collect chunks - chunks are collected by this.recorder.ondataavailable
  // This function only: 1) requests final data, 2) stops recorder, 3) waits for settle window, 4) creates blob from existing chunks
  finalizeWebM(recorder, recorderChunks, { settleMs = 500, maxMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
      let stopped = false;
      let settleTimer = null;
      let hardTimer = null;
      let lastChunkCount = recorderChunks.length;

      const cleanup = () => {
        recorder.removeEventListener("stop", onStop);
        if (settleTimer) clearTimeout(settleTimer);
        if (hardTimer) clearTimeout(hardTimer);
        if (pollInterval) clearInterval(pollInterval);
      };

      const maybeResolve = async () => {
        if (!stopped) return;
        
        // Check if chunks array changed during settle window
        const currentChunkCount = recorderChunks.length;
        if (currentChunkCount !== lastChunkCount) {
          console.log(`Chunks changed during settle: ${lastChunkCount} -> ${currentChunkCount}, resetting timer`);
          lastChunkCount = currentChunkCount;
          armSettle();
          return;
        }
        
        if (!recorderChunks.length) {
          cleanup();
          reject(new Error("No chunks recorded"));
          return;
        }
        
        // CRITICAL: Verify first chunk has valid EBML header BEFORE creating blob
        // If first chunk is missing or invalid, reject immediately
        console.log(`🔍 PRE-BLOB VALIDATION: Checking first chunk before creating blob...`);
        console.log(`   Chunks array: length=${recorderChunks.length}, recorderChunks identity: ${recorderChunks === this.chunks ? 'current' : 'captured'}`);
        
        try {
          const firstChunkBuf = await recorderChunks[0].slice(0, 4).arrayBuffer();
          const firstChunkBytes = new Uint8Array(firstChunkBuf);
          const firstChunkHeader = Array.from(firstChunkBytes).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const firstChunkValid = firstChunkBytes[0] === 0x1A && firstChunkBytes[1] === 0x45 && firstChunkBytes[2] === 0xDF && firstChunkBytes[3] === 0xA3;
          
          console.log(`🔍 FIRST CHUNK VALIDATION: header=${firstChunkHeader}, valid=${firstChunkValid}, size=${recorderChunks[0].size} bytes`);
          console.log(`   Expected: 1A 45 DF A3`);
          console.log(`   Got: ${firstChunkHeader}`);
          console.log(`   Chunks array length: ${recorderChunks.length}`);
          console.log(`   All chunk sizes: [${recorderChunks.map(c => c.size).join(', ')}]`);
          
          if (!firstChunkValid) {
            console.error("❌ CRITICAL: First chunk does not have valid WebM EBML header!");
            console.error("   This means the EBML header chunk is missing. Cannot create valid blob.");
            console.error(`   Chunks array length: ${recorderChunks.length}`);
            console.error(`   First chunk size: ${recorderChunks[0].size} bytes`);
            console.error(`   Recorder state: ${recorder.state}, mimeType: ${recorder.mimeType}`);
            cleanup();
            reject(new Error("First chunk missing valid WebM EBML header - blob would be corrupted"));
            return;
          }
          console.log(`✅ First chunk validation PASSED - EBML header is present`);
        } catch (error) {
          console.error("❌ Error validating first chunk:", error);
          console.error(`   Chunks array length: ${recorderChunks.length}`);
          cleanup();
          reject(new Error("Error validating first chunk: " + error.message));
          return;
        }
        
        const mime = recorder.mimeType || "video/webm";
        const blob = new Blob(recorderChunks, { type: mime });
        const totalChunkSize = recorderChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`📦 BLOB CREATED: size=${blob.size} bytes, chunks=${recorderChunks.length}, mimeType=${mime}`);
        console.log(`   Total chunk sizes sum: ${totalChunkSize} bytes`);
        console.log(`   Blob size matches chunks: ${blob.size === totalChunkSize ? 'YES' : `NO (diff: ${blob.size - totalChunkSize} bytes)`}`);
        
        // CRITICAL: Validate blob first 16 bytes before base64 encoding
        try {
          const buf = await blob.slice(0, 16).arrayBuffer();
          const b = new Uint8Array(buf);
          const headerHex = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          
          console.log(`🔍 BLOB HEADER VALIDATION:`);
          console.log(`   First 16 bytes (hex): ${headerHex}`);
          console.log(`   Expected EBML header: 1A 45 DF A3`);
          console.log(`   Got header: ${headerHex.substring(0, 11)}`);
          console.log(`   Valid: ${isValid}`);
          console.log(`   Blob size: ${blob.size} bytes`);
          console.log(`   Chunks: ${recorderChunks.length}`);
          
          if (!isValid) {
            console.error("❌ Blob header validation FAILED - blob is corrupted!");
            console.error(`   Chunks: ${recorderChunks.length}, Total size: ${blob.size} bytes`);
            console.error(`   First chunk size: ${recorderChunks[0] ? recorderChunks[0].size : 'N/A'} bytes`);
            console.error(`   Recorder state: ${recorder.state}, mimeType: ${recorder.mimeType}`);
            console.error(`   Root cause: MediaRecorder segmentation created invalid WebM segment.`);
            console.error(`   The blob does not start with EBML header (1A 45 DF A3).`);
            console.error(`   This typically happens when:`);
            console.error(`     1. Recorder was paused/stopped before first chunk (EBML header) was collected`);
            console.error(`     2. First chunk received was not the container header (timing issue with timeslice)`);
            console.error(`     3. Chunks array was cleared or replaced before blob creation`);
            console.error(`   Solution: Use single recorder for entire session, or ensure first chunk is always the header.`);
            cleanup();
            reject(new Error("Blob header validation failed - blob is corrupted or incomplete. MediaRecorder segmentation issue."));
            return;
          }
          console.log("✅ Blob header validation PASSED - ready for base64 encoding");
        } catch (error) {
          console.error("❌ Error validating blob header:", error);
          console.error(`   Blob size: ${blob.size}, Chunks: ${recorderChunks.length}`);
          cleanup();
          reject(new Error("Error validating blob header: " + error.message));
          return;
        }
        
        cleanup();
        resolve({ blob, mimeType: mime });
      };

      // Poll chunks array to detect when new chunks arrive
      let pollInterval = null;
      const startPolling = () => {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => {
          const currentCount = recorderChunks.length;
          if (currentCount !== lastChunkCount) {
            console.log(`Chunks changed during settle polling: ${lastChunkCount} -> ${currentCount}, resetting timer`);
            lastChunkCount = currentCount;
            armSettle(); // Reset settle timer
          }
        }, 100); // Poll every 100ms
      };
      
      const stopPolling = () => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
      
      const armSettle = () => {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          stopPolling(); // Stop polling when settle window completes
          maybeResolve().catch(err => {
            console.error("Error in maybeResolve:", err);
            cleanup();
            reject(err);
          });
        }, settleMs);
        console.log(`Settle timer armed: will finalize in ${settleMs}ms if no new chunks arrive (current chunks: ${recorderChunks.length})`);
      };

      const onStop = () => {
        stopped = true;
        console.log("=== onstop event fired ===");
        console.log("Recorder stopped, chunks:", recorderChunks.length, "mimeType:", recorder.mimeType);
        lastChunkCount = recorderChunks.length;
        startPolling(); // Start polling to detect new chunks
        armSettle(); // After stop, wait for settle window to ensure all chunks are collected
      };

      recorder.addEventListener("stop", onStop);

      // Hard timeout so we never hang forever
      hardTimer = setTimeout(() => {
        cleanup();
        reject(new Error(`Finalize timeout after ${maxMs}ms`));
      }, maxMs);

      // Log initial state before finalization
      console.log(`🔍 FINALIZEWEBM START: chunks=${recorderChunks.length}, recorderState=${recorder.state}, mimeType=${recorder.mimeType || 'unknown'}`);
      console.log(`   Chunks array length: ${recorderChunks.length}`);
      console.log(`   Chunks array identity: ${recorderChunks === this.chunks ? 'current session' : 'captured from different session'}`);
      
      if (recorderChunks.length > 0) {
        const totalSize = recorderChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`   First chunk: size=${recorderChunks[0].size} bytes, totalSize=${totalSize} bytes`);
        console.log(`   All chunk sizes: [${recorderChunks.map(c => c.size).join(', ')}]`);
        
        // CRITICAL: Validate first chunk header - if invalid, reject immediately
        recorderChunks[0].slice(0, 4).arrayBuffer().then(buf => {
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          console.log(`   🔍 FIRST CHUNK VALIDATION: header=${header}, valid=${isValid}`);
          console.log(`      Expected: 1A 45 DF A3`);
          console.log(`      Got: ${header}`);
          if (!isValid) {
            console.error("❌ CRITICAL: First chunk in array does not have valid WebM header! Blob will be corrupted!");
            console.error("   This means the EBML header chunk is missing. The blob cannot be finalized.");
            console.error(`   Chunks array: length=${recorderChunks.length}, first chunk size=${recorderChunks[0].size}`);
            // Try to request data one more time before rejecting
            try {
              recorder.requestData();
              console.log("   Requested data one more time to try to get header chunk");
            } catch (e) {
              console.error("   requestData() failed:", e);
            }
          } else {
            console.log(`   ✅ First chunk is valid - EBML header present`);
          }
        }).catch(err => {
          console.error("❌ Error reading initial first chunk header:", err);
          console.error(`   Chunks array length: ${recorderChunks.length}`);
        });
      } else {
        console.error("❌ CRITICAL: No chunks in array before finalization - this should not happen!");
        console.error(`   Recorder state: ${recorder.state}, mimeType: ${recorder.mimeType}`);
        // Try to request data before rejecting
        try {
          recorder.requestData();
          console.log("   Requested data to try to get chunks");
        } catch (e) {
          console.error("   requestData() failed:", e);
        }
      }
      
      // Critical: requestData BEFORE stop, while still active/paused
      // This ensures we get any pending data chunks (the original ondataavailable handler will collect them)
      try {
        recorder.requestData();
        console.log("requestData() called before stop");
      } catch (e) {
        console.warn("requestData() failed:", e);
      }
      
      try {
        recorder.stop();
        console.log("recorder.stop() called");
      } catch (e) {
        cleanup();
        reject(e);
      }
    });
  }

  async captureMediaDevices() {
    const stream = await navigator.mediaDevices.getUserMedia(
      this.mediaConstraints
    );
    return stream;
  }

  async recordStream() {
    console.log("🚨🚨🚨 NEW CODE VERSION 2.0 - recordStream() CALLED 🚨🚨🚨");
    console.log("🔵 [DEBUG] === recordStream called ===");
    console.log("   Current state:");
    console.log("     this.recorder:", this.recorder ? `exists (state: ${this.recorder.state})` : 'null');
    console.log("     this.chunks:", this.chunks ? `exists (length: ${this.chunks.length})` : 'undefined');
    console.log("     this.stream:", this.stream ? 'exists' : 'null');
    
    try {
      console.log("   About to capture media devices...");
    const stream = await this.captureMediaDevices();
      console.log("   ✅ Media stream captured");
      console.log("   Stream tracks:", stream ? stream.getTracks().length : 'N/A');
      // Store stream for reuse when restarting recording sessions
      this.stream = stream;
      console.log("   Stream stored in this.stream");
      
    ///// PLAY CAMERA
    const camera_video = document.getElementById(this.id);
      if (!camera_video) {
        console.error("❌ Camera video element not found:", this.id);
        return Promise.reject(new Error("Camera video element not found"));
      }
      console.log("   Camera video element found, setting srcObject...");
    camera_video.srcObject = stream;
      console.log("   About to play camera video...");
    await camera_video.play();
      console.log("   ✅ Camera video playing");
    ///// PLAY CAMERA
      
      // DO NOT automatically start recording session here
      // Recording will only start when:
      // 1. User clicks the recording button (enables recording mode)
      // 2. AND YouTube video is playing (checked in resumeRecording/startNewRecordingSession)
      // 
      // CRITICAL: If recorder exists but chunks don't, something went wrong - reinitialize
      if (this.recorder && !this.chunks) {
        console.warn("⚠️ WARNING: Recorder exists but chunks array is missing!");
        console.warn("   This should not happen - recorder should only exist if startNewRecordingSession() ran");
        console.warn("   Will reinitialize when recording actually starts (button clicked + video playing)");
      }
      
      console.log("   ✅ Stream ready - recording will start when button is clicked and video is playing");
      console.log("   After recordStream():");
      console.log("     this.recorder:", this.recorder ? `exists (state: ${this.recorder.state})` : 'null (will be created when recording starts)');
      console.log("     this.chunks:", this.chunks ? `exists (length: ${this.chunks.length})` : 'undefined (will be created when recording starts)');
      
      // Return a resolved promise to indicate success
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Error in recordStream:", error);
      console.error("   Error details:", error.message, error.stack);
      return Promise.reject(error);
    }
  }

  startNewRecordingSession() {
    console.log("🔵 [DEBUG] === startNewRecordingSession called ===");
    console.log("   this.stream exists:", !!this.stream);
    console.log("   this.recorder exists:", !!this.recorder);
    console.log("   this.recorder state:", this.recorder ? this.recorder.state : 'N/A');
    
    // CRITICAL: Only start recording if YouTube video is actually playing
    if (this.player && this.player.getPlayerState) {
      const playerState = this.player.getPlayerState();
      const isPlaying = playerState === YT.PlayerState.PLAYING;
      console.log("   YouTube player state:", playerState, "isPlaying:", isPlaying);
      
      if (!isPlaying) {
        console.error("❌ Cannot start recording session - YouTube video is not playing. State:", playerState);
        console.error("   Recording will start automatically when video plays");
        return;
      }
    } else {
      console.warn("⚠️ Cannot check player state - player or getPlayerState not available");
      // Don't start recording if we can't verify the video is playing
      return;
    }
    
    if (!this.stream) {
      console.error("❌ No stream available to start recording");
      return;
    }
    console.log("✅ Stream available, creating MediaRecorder...");

    // Store reference to old recorder so its onstop can complete
    const oldRecorder = this.recorder;
    if (oldRecorder && oldRecorder.state !== 'inactive') {
      console.warn("⚠️ Starting new session while old recorder is still active! State:", oldRecorder.state);
      // Don't replace the recorder yet - wait for it to become inactive
      // This should not happen if resumeRecording waits properly
    }

    // Choose a supported mimeType for MediaRecorder
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) || undefined;
    console.log("Creating MediaRecorder with mimeType:", mimeType || "default");
    
    // Create sessionId FIRST before using it
    const sessionId = Date.now() + Math.random();
    
    // Create a new MediaRecorder for this session
    console.log(`🔵 [DEBUG] Creating new MediaRecorder for sessionId=${sessionId}`);
    console.log(`   Stream tracks: ${this.stream ? this.stream.getTracks().length : 'N/A'}`);
    console.log(`   MimeType: ${mimeType || 'default'}`);
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    console.log(`   ✅ MediaRecorder created, state: ${this.recorder.state}`);
    console.log(`   MimeType supported: ${MediaRecorder.isTypeSupported(this.recorder.mimeType)}`);
    // Store mimeType for later use
    this.recorderMimeType = this.recorder.mimeType || mimeType || "video/webm";
    console.log("MediaRecorder created with mimeType:", this.recorderMimeType);
    
    // Create a new chunks array for this session (store on instance)
    // IMPORTANT: The old recorder's onstop handler has a closure over the OLD chunks array,
    // so creating a new array here doesn't affect the old handler
    // sessionId was already created above
    this.chunks = [];
    this.currentSessionId = sessionId;
    
    console.log(`🆕 NEW SESSION CREATED: sessionId=${sessionId}, chunks array created (empty)`);
    console.log(`Previous sessionId: ${this.previousSessionId || 'none'}, previous chunks length: ${this.previousChunksLength || 0}`);
    this.previousSessionId = sessionId;
    this.previousChunksLength = 0;
    
    // Reference to chunks for this closure - use let so we can clear it properly
    let chunks = this.chunks;
    const me = this;

    function total_chunk_size() {
      let total_size = 0;
      for (let i in chunks) {
        let chunk = chunks[i];
        total_size += chunk.size;
      }
      return total_size;
    }

    this.recorder.ondataavailable = (event) => {
      console.log(`🔵 [DEBUG] ondataavailable fired: sessionId=${sessionId}, data size=${event.data ? event.data.size : 0}, state=${this.recorder.state}`);
      if (event.data && event.data.size > 0) {
        const chunkIndex = chunks.length;
        chunks.push(event.data);
        console.log(`   ✅ Chunk ${chunkIndex} added to chunks array, new length: ${chunks.length}, me.chunks length: ${me.chunks ? me.chunks.length : 'N/A'}`);
        
        // Log first chunk header for debugging - CRITICAL for detecting missing header
        if (chunks.length === 1) {
          console.log(`🎯 FIRST CHUNK ARRIVED: sessionId=${sessionId}, chunkIndex=0, size=${event.data.size} bytes`);
          event.data.slice(0, 4).arrayBuffer().then(buf => {
            const b = new Uint8Array(buf);
            const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
            console.log(`✅ FIRST CHUNK VALIDATION: sessionId=${sessionId}, header=${header}, valid=${isValid}`);
            console.log(`   Expected: 1A 45 DF A3, Got: ${header}`);
            if (!isValid) {
              console.error("❌ CRITICAL: First chunk does not have valid WebM header! This will cause corruption!");
              console.error(`   SessionId: ${sessionId}, Chunk size: ${event.data.size}, Recorder state: ${me.recorder.state}`);
            } else {
              console.log(`✅ First chunk is valid - EBML header present`);
            }
          }).catch(err => {
            console.error("❌ Error reading first chunk header:", err);
            console.error(`   SessionId: ${sessionId}, Chunk size: ${event.data.size}`);
          });
        } else {
          console.log(`📦 CHUNK ${chunkIndex}: sessionId=${sessionId}, size=${event.data.size} bytes, total=${chunks.length} chunks, totalSize=${total_chunk_size()} bytes, state=${me.recorder.state}`);
        }
      } else {
        console.warn(`⚠️ Empty chunk received: sessionId=${sessionId}, recorder state: ${me.recorder.state}`);
      }
    };

    this.recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event);
      console.error("Recorder state:", me.recorder.state);
      console.error("Chunks at error:", chunks.length, "total size:", total_chunk_size());
      // Don't try to process blob if there was an error
    };

    this.recorder.onstart = () => {
      console.log("🔵 [DEBUG] === MediaRecorder onstart event ===");
      console.log(`   sessionId=${sessionId}, state=${this.recorder.state}`);
      console.log("   Recorder started - waiting for MediaRecorder to NATURALLY send first chunk (EBML header)...");
      console.log("   DO NOT calling requestData() - let MediaRecorder send header chunk naturally");
      console.log(`   Handlers attached: ondataavailable=${!!this.recorder.ondataavailable}, onpause=${!!this.recorder.onpause}, onstop=${!!this.recorder.onstop}`);
      // CRITICAL: Do NOT call requestData() here
      // MediaRecorder will automatically send the EBML header as the first chunk
      // Calling requestData() too early might cause it to send a non-header chunk
      
      // Recording started - button state already reflects this
    };

    this.recorder.onresume = () => {
      console.log("=== MediaRecorder onresume event ===");
      console.log("Recorder resumed, chunks so far:", chunks.length);
      
      // CRITICAL: When resuming, the first chunk should ALREADY exist (collected when recorder was first started)
      // If it doesn't exist, that's a problem - the recorder was resumed before the header chunk was collected
      // DO NOT call requestData() here - it might send a non-header chunk
      if (chunks.length > 0) {
        // Verify first chunk has valid header
        chunks[0].slice(0, 4).arrayBuffer().then(buf => {
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          if (isValid) {
            console.log("✅ First chunk has valid WebM header on resume:", header);
          } else {
            console.error("❌❌❌ CRITICAL: First chunk does not have valid WebM header on resume!");
            console.error("Header:", header, "Expected: 1A 45 DF A3");
            console.error("This means the recorder was resumed before the EBML header chunk was collected.");
            console.error("The blob will be corrupted. This should not happen if waitForFirstChunk completed successfully.");
            // DO NOT call requestData() - it's too late, the header should have been collected already
          }
        }).catch(err => console.warn("Could not verify first chunk header on resume:", err));
      } else {
        console.error("❌❌❌ CRITICAL: No chunks collected when resuming!");
        console.error("This means the recorder was resumed before the EBML header chunk was collected.");
        console.error("The blob will be corrupted. This should not happen if waitForFirstChunk completed successfully.");
        // DO NOT call requestData() - it's too late, and might send a non-header chunk
      }
      
      // Only create a new shot if one doesn't already exist for this session
      // This prevents creating duplicate shots if resume is called multiple times
      let current_recording = me.recording;
      let active_shot = current_recording.get_active_shot();
      
      // If active shot already has an ID, don't create a new one
      if (active_shot && active_shot.recording_shot_id !== null && active_shot.recording_shot_id !== undefined) {
        console.log("Resuming with existing shot ID:", active_shot.recording_shot_id);
        return;
      }
      
      // Create new shot for this recording session
      let session_id = null; // this must be from server. change this later
      let original_video_start = me.player.playerInfo.currentTime;
      let recording_start = 0;
      let js_start = new Date().getTime();
      // eslint-disable-next-line
      let shot = new recording_shot(
        session_id,
        original_video_start,
        recording_start,
        js_start
      );
      current_recording.add_shot(shot);
      console.log("Created new shot on resume, opening on server...");
      // openVideoRecordingShot: create recording_shot in database and use current_recording.recording_id
      me.open_recording_shot(
        current_recording.recording_id,
        original_video_start,
        recording_start,
        js_start
      );
    };

    console.log(`🔵 [DEBUG] Attaching onpause handler to recorder, sessionId=${sessionId}`);
    this.recorder.onpause = () => {
      console.log("🟢 [DEBUG] === onpause event triggered ===");
      console.log(`   ⏸️ PAUSE: sessionId=${sessionId}, state=${me.recorder.state}`);
      console.log(`   chunks (closure) length: ${chunks.length}`);
      console.log(`   me.chunks length: ${me.chunks ? me.chunks.length : 'N/A'}`);
      console.log(`   totalSize: ${total_chunk_size()} bytes`);
      console.log(`   Chunks array reference: ${chunks === me.chunks ? 'current' : 'DIFFERENT!'}`);
      console.log(`   Current sessionId: ${me.currentSessionId}, This sessionId: ${sessionId}`);
      console.log(`   _record_blob_base64 available: ${!!me._record_blob_base64}`);
      console.log(`   _record_blob_base64 type: ${typeof me._record_blob_base64}`);
      console.log(`   Recorder state check: ${me.recorder.state}`);
      
      // CRITICAL: Verify first chunk exists before finalizing
      if (chunks.length > 0) {
        console.log(`   First chunk exists: size=${chunks[0].size} bytes`);
        chunks[0].slice(0, 4).arrayBuffer().then(buf => {
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          console.log(`   First chunk header on pause: ${header}, valid: ${isValid}`);
          if (!isValid) {
            console.error(`❌ CRITICAL: First chunk missing valid WebM header on pause! sessionId=${sessionId}`);
            console.error(`   Header: ${header}, Expected: 1A 45 DF A3`);
            try {
              me.recorder.requestData();
              console.log(`   Requested data to try to get header chunk`);
            } catch (e) {
              console.error("   requestData() failed on pause:", e);
            }
          } else {
            console.log(`✅ First chunk is valid on pause`);
          }
        }).catch(err => {
          console.error(`❌ Error verifying first chunk on pause: sessionId=${sessionId}`, err);
        });
      } else {
        console.warn(`⚠️ WARNING: No chunks collected when pausing! sessionId=${sessionId}`);
        console.warn(`   This means recording started but no chunks were collected yet`);
        try {
          me.recorder.requestData();
          console.log(`   Requested data to try to get chunks`);
        } catch (e) {
          console.error("   requestData() failed on pause:", e);
        }
      }
      
      // When user pauses, we need to stop the current recording segment
      // to finalize and save it. Then when they resume, we'll start a new segment.
      if (me.recorder.state === 'paused') {
        console.log("Paused - will finalize segment after brief delay");
        // CRITICAL: Capture the chunks array reference NOW, before any new session can start
        // This ensures we use the correct chunks even if startNewRecordingSession is called
        const chunksToFinalize = chunks; // Capture reference to current chunks array
        const recorderToFinalize = me.recorder; // Capture reference to current recorder
        const mimeTypeToUse = recorderToFinalize.mimeType || me.recorderMimeType || "video/webm";
        const capturedSessionId = sessionId;
        
        console.log(`📸 CAPTURED FOR FINALIZATION: sessionId=${capturedSessionId}, chunks=${chunksToFinalize.length}, chunksRef=${chunksToFinalize === me.chunks ? 'current' : 'captured'}`);
        console.log(`   Current sessionId: ${me.currentSessionId}, Captured sessionId: ${capturedSessionId}`);
        console.log(`   Chunks array identity: ${chunksToFinalize === chunks ? 'same' : 'DIFFERENT!'}`);
        
        // Mark that we're pausing (not ending), so we can restart later
        me.isPaused = true;
        
        // CRITICAL: Wait for first chunk if missing, then finalize
        const waitForFirstChunkThenFinalize = async (attempts = 0, maxAttempts = 60) => {
          // Check if first chunk exists and is valid
          if (chunksToFinalize.length > 0) {
            try {
              const firstChunkBuf = await chunksToFinalize[0].slice(0, 4).arrayBuffer();
              const b = new Uint8Array(firstChunkBuf);
              const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
              const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
              
              if (isValid) {
                // First chunk is valid, proceed with finalization
                console.log(`✅ First chunk validated before finalization: ${header}`);
                const original_video_end = me.player.playerInfo.currentTime;
                const js_end = Date.now();
                console.log(`🔚 FINALIZING SEGMENT: sessionId=${capturedSessionId}, chunks=${chunksToFinalize.length}, recorderState=${recorderToFinalize.state}`);
                console.log(`   Chunks array still same: ${chunksToFinalize === chunks ? 'yes' : 'NO - CHANGED!'}`);
                console.log(`   Current sessionId: ${me.currentSessionId}, Finalizing sessionId: ${capturedSessionId}`);
                
                // Always use direct finalization (stopAndProcessCurrentSegmentWithChunks is not accessible)
                console.log("🚀 Starting direct finalization (finalizeWebM -> _record_blob_base64)...");
                me.finalizeWebM(recorderToFinalize, chunksToFinalize, { settleMs: 1000, maxMs: 10000 })
                  .then(async ({ blob, mimeType: finalMimeType }) => {
                    console.log("✅ finalizeWebM completed, blob size:", blob.size, "mimeType:", finalMimeType);
                    const ok = await me.validateWebMHeader(blob);
                    if (!ok) {
                      console.error("❌ Invalid WebM header after finalization");
                      throw new Error("Invalid WebM header");
                    }
                    console.log("✅ WebM header validation passed");
                    if (me._record_blob_base64) {
                      console.log("🚀 Calling _record_blob_base64 to start chunked upload...");
                      const recorderId = Date.now() + Math.random();
                      me._record_blob_base64(original_video_end, js_end, recorderId, blob, finalMimeType);
                    } else {
                      console.error("❌ _record_blob_base64 not available");
                    }
                  })
                  .catch(err => {
                    console.error("❌ Error in direct finalization:", err);
                    console.error("   Error details:", err.message, err.stack);
                  });
                return;
              } else {
                // First chunk exists but is invalid - request data to try to get header
                console.warn(`⚠️ First chunk exists but invalid (${header}), requesting data... attempt ${attempts + 1}/${maxAttempts}`);
                if (recorderToFinalize.state === 'paused') {
                  try {
                    recorderToFinalize.requestData();
                  } catch (e) {
                    console.error("requestData() failed on paused recorder:", e);
                  }
                }
              }
            } catch (err) {
              console.error(`❌ Error reading first chunk: sessionId=${capturedSessionId}`, err);
            }
          } else {
            // No chunks yet - request data and wait
            if (attempts === 0) {
              console.warn(`⚠️ No chunks collected yet, requesting data... sessionId=${capturedSessionId}`);
              if (recorderToFinalize.state === 'paused') {
                try {
                  recorderToFinalize.requestData();
                } catch (e) {
                  console.error("requestData() failed on paused recorder:", e);
                }
              }
            }
          }
          
          // If we haven't gotten a valid first chunk yet, wait and retry
          if (attempts < maxAttempts) {
            setTimeout(() => {
              if (recorderToFinalize && (recorderToFinalize.state === 'paused' || recorderToFinalize.state === 'inactive')) {
                waitForFirstChunkThenFinalize(attempts + 1, maxAttempts);
              } else {
                console.warn(`⚠️ Recorder state changed during wait: sessionId=${capturedSessionId}, state=${recorderToFinalize ? recorderToFinalize.state : 'null'}`);
              }
            }, 100); // Check every 100ms
          } else {
            // Max attempts reached - check what we have
            console.error(`❌❌❌ CRITICAL: First chunk not validated after ${maxAttempts * 100}ms! sessionId=${capturedSessionId}`);
            if (chunksToFinalize.length > 0) {
              chunksToFinalize[0].slice(0, 4).arrayBuffer().then(buf => {
                const b = new Uint8Array(buf);
                const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
                console.error(`   First chunk header: ${header}, Expected: 1A 45 DF A3`);
                console.error(`   ❌❌❌ REJECTING BLOB - Cannot finalize without valid EBML header! ❌❌❌`);
                console.error(`   This blob will NOT be sent to server. The recording segment is lost.`);
                console.error(`   Root cause: MediaRecorder did not provide valid first chunk (EBML header) before pause.`);
                console.error(`   The first chunk received was: ${header}, which is NOT the WebM container header.`);
                console.error(`   This typically happens when:`);
                console.error(`     1. Recorder was paused before EBML header chunk arrived`);
                console.error(`     2. MediaRecorder sent data chunks before the header chunk`);
                console.error(`     3. Chunks array was corrupted or replaced`);
              }).catch(() => {});
            } else {
              console.error(`   No chunks collected at all - cannot create blob`);
            }
            // DO NOT proceed - reject the blob entirely
            console.error(`   ❌❌❌ Aborting finalization - blob would be corrupted. ❌❌❌`);
            // Clear the corrupted chunks to prevent accidental use
            chunksToFinalize.length = 0;
            return; // Don't finalize corrupted blob
          }
        };
        
        // Start waiting for first chunk
        waitForFirstChunkThenFinalize();
      } else {
        console.warn("onpause fired but recorder state is not 'paused', state:", me.recorder.state);
      }
    };

    // Store recordBlobBase64 reference for use in stopAndProcessCurrentSegment
    // Use arrow function to preserve 'me' from outer scope
    // CRITICAL: Also store on 'this' so it's accessible from outside
    me._record_blob_base64 = async (original_video_end, js_end, recorderId, blob, blobMimeType) => {
      console.log("🟣 [DEBUG] === _record_blob_base64 called ===");
      console.log(`   📥 RECEIVED BLOB: size=${blob ? blob.size : 'null'} bytes, mimeType=${blobMimeType}, recorderId=${recorderId}`);
      console.log(`   original_video_end=${original_video_end}, js_end=${js_end}`);
      console.log(`   Call stack trace:`, new Error().stack);
      
      if (!blob || blob.size <= 0) {
        console.warn("No blob available to save");
        // Remove from pending list
        if (recorderId !== undefined) {
          me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
          console.log("Removed recorder from pending list (no blob), remaining:", me.pendingRecorders.length);
        }
        return;
      }
      
      // Verify we have an active shot before processing
      let current_recording = me.recording;
      let active_shot = current_recording.get_active_shot();
      if (!active_shot) {
        console.error("No active shot found - cannot process blob");
        // Remove from pending list
        if (recorderId !== undefined) {
          me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
          console.log("Removed recorder from pending list (no active shot), remaining:", me.pendingRecorders.length);
        }
        return;
      }
      
      // CRITICAL: Store the shot reference and parameters IMMEDIATELY when onstop fires
      // This ensures we close the correct shot even if a new shot is created during blob processing
      let target_shot = active_shot; // Store reference to the shot that was active when onstop fired
      let target_shot_start = active_shot.original_video_start;
      let target_shot_js_start = active_shot.js_start;
      let target_shot_id = active_shot.recording_shot_id;
      
      console.log("Processing blob - target shot:", {
        start: target_shot_start,
        js_start: target_shot_js_start,
        id: target_shot_id,
        blobSize: blob.size,
        blobMimeType: blobMimeType
      });
      
      // If shot ID is null, we need to wait for it before processing
      // This is especially important after resume when a new shot is created
      if (target_shot_id === null || target_shot_id === undefined) {
        console.warn("Target shot ID is null - retry mechanism will wait for it");
        // Continue processing - the retry mechanism will wait for the ID
      }

      // Blob is already created and validated, just get size
      let chunk_size = blob.size;
      let recording_end = chunk_size;
      
      // Validate blob size - server will check this too
      if (blob.size === 0) {
        console.error("Blob size is 0, cannot save - file will be incomplete");
        return; // Don't clear chunks yet, might retry
      }
      
      // Check minimum size (very small files are likely incomplete)
      // WebM files should be at least a few KB for a valid video
      if (blob.size < 1024) {
        console.error(`Blob size (${blob.size} bytes) is too small, likely incomplete - not sending`);
        return;
      }
      
      // Blob is already validated and finalized, proceed with processing
      
      // Additional verification: Try to read a small portion of the blob to ensure it's valid
      // This helps catch cases where the blob exists but is corrupted
      try {
        const testSlice = blob.slice(0, Math.min(100, blob.size));
        if (testSlice.size === 0 && blob.size > 0) {
          console.error("Blob slice test failed - blob may be corrupted");
          return;
        }
      } catch (error) {
        console.error("Error testing blob slice:", error);
        return;
      }

      // Additional check: verify blob size is reasonable for the duration
      // Very small blobs relative to expected size might be incomplete
      const expectedMinSize = 50000; // At least 50KB for a few seconds of video
      if (blob.size < expectedMinSize) {
        console.warn(`Blob size (${blob.size} bytes) seems small - might be incomplete`);
        // Still proceed, but log warning
      }
      
      console.log(`Processing blob: size=${blob.size} bytes, mimeType=${blobMimeType}, shot ID: ${active_shot.recording_shot_id}`);
      
      // CRITICAL: Validate blob first 16 bytes BEFORE clearing chunks or converting to base64
      // This ensures we catch corruption before sending to server
      console.log(`🔍 VALIDATING BLOB BEFORE PROCESSING...`);
      let blobValidation = false;
      try {
        const buf = await blob.slice(0, 16).arrayBuffer();
        const b = new Uint8Array(buf);
        const headerHex = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        blobValidation = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
        console.log(`🔍 BLOB VALIDATION BEFORE BASE64:`);
        console.log(`   First 16 bytes (hex): ${headerHex}`);
        console.log(`   Expected EBML header: 1A 45 DF A3`);
        console.log(`   Got header: ${headerHex.substring(0, 11)}`);
        console.log(`   Valid WebM header: ${blobValidation ? '✅ YES' : '❌ NO'}`);
        
        if (!blobValidation) {
          console.error("❌ CRITICAL: Blob is corrupted before base64 encoding!");
          console.error(`   Header: ${headerHex}, Expected: 1A 45 DF A3`);
          console.error(`   Chunks: ${chunks.length}, Total size: ${blob.size} bytes`);
          if (chunks.length > 0) {
            console.error(`   First chunk size: ${chunks[0].size} bytes`);
            // Check first chunk header
            chunks[0].slice(0, 4).arrayBuffer().then(chunkBuf => {
              const chunkBytes = new Uint8Array(chunkBuf);
              const chunkHeader = Array.from(chunkBytes).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
              console.error(`   First chunk header: ${chunkHeader}`);
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("❌ Error validating blob before base64:", err);
        blobValidation = false;
      }
      
      if (!blobValidation) {
        console.error("❌ BLOB VALIDATION FAILED - NOT PROCESSING BLOB");
        console.error("   This blob will NOT be sent to server. Recording segment is lost.");
        console.error("   Root cause: MediaRecorder segmentation created invalid WebM segment.");
        // Remove from pending list
        if (recorderId !== undefined) {
          me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
          console.log("Removed recorder from pending list (blob validation failed), remaining:", me.pendingRecorders.length);
        }
        return; // CRITICAL: Exit early - do not process corrupted blob
      }
      
      console.log("✅ Blob validation passed - proceeding with chunked upload");
      
      // Mark recorder as processed BEFORE clearing chunks to prevent onstop handler from processing
      if (me.recorder) {
        me.recorder._blobProcessed = true;
        console.log("   ✅ Marked recorder as processed BEFORE clearing chunks (prevents onstop duplicate processing)");
      }
      
      // NOW we can safely clear chunks - blob is validated
      // BUT: Only clear if this is the current session's chunks array
      // If we're finalizing an old session, don't clear the current session's chunks
      if (me.chunks && me.chunks === chunks) {
        const chunksBeforeClear = me.chunks.length;
        const sessionIdBeforeClear = me.currentSessionId;
        me.chunks.length = 0; // Clear chunks in place
        console.log(`🧹 CHUNKS CLEARED AFTER VALIDATION: sessionId=${sessionIdBeforeClear}, chunksBeforeClear=${chunksBeforeClear}, chunksAfterClear=${me.chunks.length}`);
        console.log(`   This happens after blob is validated and sent to server`);
      } else {
        console.log(`⚠️ NOT CLEARING CHUNKS: chunks array identity mismatch`);
        console.log(`   me.chunks === chunks: ${me.chunks === chunks}`);
        console.log(`   me.chunks exists: ${!!me.chunks}, chunks exists: ${!!chunks}`);
        console.log(`   Current sessionId: ${me.currentSessionId}`);
      }
      
      const blob_url = URL.createObjectURL(blob);
      
      // Wait for shot ID before starting upload
      const waitForShotIdAndUpload = async (maxRetries = 200, retryDelay = 100) => {
        console.log(`🔵 [DEBUG] waitForShotIdAndUpload called: retries=${maxRetries}, delay=${retryDelay}`);
        console.log(`   target_shot_start: ${target_shot_start}, target_shot_js_start: ${target_shot_js_start}`);
        console.log(`   current_recording.recording_shots.length: ${current_recording.recording_shots.length}`);
        
        // Find the target shot (with tolerance for float precision)
        let shot_to_upload = null;
        const TIME_TOLERANCE = 0.05;
        if (target_shot_start !== null && target_shot_js_start !== null) {
          console.log(`   🔍 Searching for shot with start=${target_shot_start}, js_start=${target_shot_js_start}`);
          for (let i = current_recording.recording_shots.length - 1; i >= 0; i--) {
            let s = current_recording.recording_shots[i];
            const timeDiff = Math.abs(s.original_video_start - target_shot_start);
            console.log(`   Checking shot ${i}: start=${s.original_video_start}, js_start=${s.js_start}, id=${s.recording_shot_id}, timeDiff=${timeDiff}`);
            if (timeDiff < TIME_TOLERANCE && s.js_start === target_shot_js_start) {
              shot_to_upload = s;
              console.log(`   ✅ Found matching shot: ${s.recording_shot_id}`);
              break;
            }
          }
        }
        
        // Fallback to stored reference
        if (!shot_to_upload && target_shot && current_recording.recording_shots.indexOf(target_shot) >= 0) {
          console.log(`   🔄 Using fallback: stored target_shot reference`);
          shot_to_upload = target_shot;
        }
        
        // Final fallback: use active shot
        if (!shot_to_upload) {
          console.log(`   🔄 Using final fallback: active shot`);
          shot_to_upload = current_recording.get_active_shot();
          console.log(`   Active shot: ${shot_to_upload ? `id=${shot_to_upload.recording_shot_id}` : 'null'}`);
        }
        
        if (!shot_to_upload) {
          console.warn(`   ⚠️ No shot found, retries remaining: ${maxRetries}`);
          if (maxRetries > 0) {
            setTimeout(() => waitForShotIdAndUpload(maxRetries - 1, retryDelay), retryDelay);
          return;
          } else {
            console.error("❌ No shot found to upload after all retries");
            if (recorderId !== undefined) {
              me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
            }
          return;
        }
        }
        
        const shot_id = shot_to_upload.recording_shot_id;
        console.log(`   🔍 Shot found: id=${shot_id}, retries remaining: ${maxRetries}`);
        
        if (shot_id === null || shot_id === undefined) {
          console.warn(`   ⚠️ Shot ID is null/undefined, retries remaining: ${maxRetries}`);
          if (maxRetries > 0) {
            if (maxRetries % 20 === 0) {
              console.log(`   ⏳ Waiting for shot ID... (${maxRetries} retries remaining)`);
            }
            setTimeout(() => waitForShotIdAndUpload(maxRetries - 1, retryDelay), retryDelay);
              return;
          } else {
            console.error("❌ Shot ID not available after all retries");
            if (recorderId !== undefined) {
              me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
            }
          return;
          }
        }

        // Shot ID is available, start upload
        console.log(`🟢 [DEBUG] ✅ Starting chunked upload for shot ${shot_id}, blob size: ${blob.size} bytes`);
        console.log(`   🔍 About to get UploadManager...`);
        console.log(`   🔍 me.token available: ${!!me.token}`);
        console.log(`   🔍 blob type: ${blob.type}, size: ${blob.size} bytes`);
        
        try {
          console.log(`   🔍 Calling getUploadManager()...`);
          const uploadManager = await getUploadManager();
          console.log(`   ✅ UploadManager obtained:`, !!uploadManager);
          console.log(`   🔍 UploadManager type:`, typeof uploadManager);
          console.log(`   🔍 UploadManager.startOrResumeShotUpload type:`, typeof uploadManager?.startOrResumeShotUpload);
          
          console.log(`   🔍 Calling uploadManager.startOrResumeShotUpload with:`);
          console.log(`      shotId: ${shot_id}`);
          console.log(`      blob size: ${blob.size}`);
          console.log(`      contentType: ${blobMimeType || 'video/webm'}`);
          
          const result = await uploadManager.startOrResumeShotUpload({
            token: me.token,
            shotId: shot_id,
            blob: blob,
            contentType: blobMimeType || 'video/webm',
            original_video_end: original_video_end,
            recording_end: recording_end,
            js_end: js_end,
            onProgress: (progress) => {
              console.log(`Upload progress for shot ${shot_id}: ${(progress * 100).toFixed(1)}%`);
              // Update shot with progress if needed
              if (shot_to_upload && shot_to_upload.set_upload_progress) {
                shot_to_upload.set_upload_progress(progress);
              }
            },
            onError: (error) => {
              console.error(`Upload failed for shot ${shot_id}:`, error);
              if (shot_to_upload && shot_to_upload.set_upload_error) {
                shot_to_upload.set_upload_error(error.message);
              }
            },
            onComplete: (result) => {
              console.log(`✅ Upload complete for shot ${shot_id}:`, result);
              // Update shot with video_url
              if (result.video_url && shot_to_upload) {
                shot_to_upload.set_video_url(result.video_url);
                shot_to_upload.close(
                  null, // no base64 data needed
                  blob_url,
                  chunk_size,
                  original_video_end,
                  recording_end,
                  js_end
                );
              }
            }
          });
          
          // Upload completed successfully
          console.log(`🟢 [DEBUG] ✅ Upload finalized for shot ${shot_id}`);
          console.log(`   Result:`, result);
          
        } catch (error) {
          console.error(`❌ Upload error for shot ${shot_id}:`, error);
          if (shot_to_upload && shot_to_upload.set_upload_error) {
            shot_to_upload.set_upload_error(error.message);
          }
        } finally {
          // Remove from pending list
          if (recorderId !== undefined) {
            me.pendingRecorders = me.pendingRecorders.filter(p => p.id !== recorderId);
            console.log("Removed recorder from pending list, remaining:", me.pendingRecorders.length);
          }
        }
      };
      
      // Start waiting for shot ID and upload
      waitForShotIdAndUpload();
    }
    
    // CRITICAL: Make _record_blob_base64 accessible on 'this' as well
    // This ensures it can be accessed from outside startNewRecordingSession
    this._record_blob_base64 = me._record_blob_base64;
    console.log(`🔵 [DEBUG] _record_blob_base64 stored on 'this', sessionId=${sessionId}`);
    console.log(`   this._record_blob_base64 type: ${typeof this._record_blob_base64}`);
    console.log(`   me._record_blob_base64 type: ${typeof me._record_blob_base64}`);

    // onstop handler - process blob when recorder stops
    // This is a fallback in case onpause doesn't fire or blob wasn't processed
    console.log(`🔵 [DEBUG] Attaching onstop handler to recorder, sessionId=${sessionId}`);
    console.log(`   Recorder exists: ${!!this.recorder}`);
    console.log(`   Recorder state: ${this.recorder ? this.recorder.state : 'N/A'}`);
    console.log(`   Current onstop handler before setting:`, this.recorder.onstop?.toString().substring(0, 100));
    
    // Store our handler function
    const ourOnStopHandler = async (event) => {
      console.log("🟡 [DEBUG] === recorder.onstop event triggered ===");
      console.log("   Event:", event);
      console.log("   Event type:", event?.type);
      console.log("   Event target:", event?.target);
      const stoppedRecorder = event.target || event;
      console.log("   Stopped recorder state:", stoppedRecorder.state);
      console.log("   chunks (closure) length:", chunks.length);
      console.log("   me.chunks length:", me.chunks ? me.chunks.length : 'N/A');
      console.log("   mimeType:", stoppedRecorder.mimeType);
      console.log("   _record_blob_base64 available:", !!me._record_blob_base64);
      console.log("   _record_blob_base64 type:", typeof me._record_blob_base64);
      console.log("   chunks reference same as me.chunks:", chunks === me.chunks);
      console.log("   Event target:", event.target);
      console.log("   Event type:", event.type);
      
      // Use me.chunks (the actual chunks array) instead of closure variable
      const chunksToUse = me.chunks && me.chunks.length > 0 ? me.chunks : chunks;
      console.log("   🔍 DECISION: Using chunks array with length:", chunksToUse.length);
      console.log("   🔍 DECISION: chunksToUse === me.chunks:", chunksToUse === me.chunks);
      console.log("   🔍 DECISION: chunksToUse === chunks:", chunksToUse === chunks);
      
      // Check if this recorder was already processed by stopAndProcessCurrentSegmentWithChunks
      if (stoppedRecorder._blobProcessed) {
        console.log("⏭️ Skipping duplicate blob processing - recorder already processed by stopAndProcessCurrentSegmentWithChunks");
        console.log("   Recorder ID:", stoppedRecorder._recorderId || 'N/A', "Blob processed flag:", stoppedRecorder._blobProcessed);
        // Update LED to show recording stopped
        return;
      }
      
      // Also check if chunks were already cleared (indicates blob was already processed)
      if (chunksToUse.length === 0) {
        console.log("⏭️ Skipping duplicate blob processing - chunks already cleared (blob was already processed)");
        console.log("   chunksToUse.length:", chunksToUse.length, "me.chunks.length:", me.chunks ? me.chunks.length : 'N/A', "chunks.length:", chunks.length);
        // Update LED to show recording stopped
        return;
      }
      
      // Process blob if we have chunks and _record_blob_base64 is available
      // This ensures blob is processed even if onpause didn't fire
      // BUT: Only if it hasn't been processed already
      if (chunksToUse.length > 0 && me._record_blob_base64 && !stoppedRecorder._blobProcessed) {
        console.log("🚀 Processing blob from onstop handler (fallback)...");
        try {
          // Mark as processing to prevent duplicate processing
          stoppedRecorder._blobProcessed = true;
          
          // Finalize the blob
          const { blob, mimeType: finalMimeType } = await me.finalizeWebM(stoppedRecorder, chunksToUse, {
            settleMs: 1000,
            maxMs: 10000
          });
          
          console.log("✅ finalizeWebM completed in onstop, blob size:", blob.size);
          
          // Validate header
          const ok = await me.validateWebMHeader(blob);
          if (!ok) {
            console.error("❌ Invalid WebM header - blob corrupted");
                return;
              }
          
          // Get timing info
          const original_video_end = me.player.playerInfo.currentTime;
          const js_end = Date.now();
          const recorderId = Date.now() + Math.random();
          
          // Call _record_blob_base64 to upload via UploadManager
          console.log("🚀 Calling _record_blob_base64 from onstop handler...");
          me._record_blob_base64(original_video_end, js_end, recorderId, blob, finalMimeType);
        } catch (err) {
          console.error("❌ Error processing blob in onstop handler:", err);
          console.error("   Error details:", err.message, err.stack);
          // Reset flag on error so it can be retried if needed (though unlikely)
          stoppedRecorder._blobProcessed = false;
        }
      } else {
        if (stoppedRecorder._blobProcessed) {
          console.log("⏭️ Skipping blob processing in onstop - already processed (flag set)");
        } else {
          console.warn("⚠️ Cannot process blob in onstop - chunks:", chunks.length, "has _record_blob_base64:", !!me._record_blob_base64);
        }
        // Try using me.chunks if chunks is empty
        if (chunks.length === 0 && me.chunks && me.chunks.length > 0 && me._record_blob_base64) {
          console.log("🔄 Retrying with me.chunks instead of chunks reference...");
          try {
            const { blob, mimeType: finalMimeType } = await me.finalizeWebM(stoppedRecorder, me.chunks, {
              settleMs: 1000,
              maxMs: 10000
            });
            console.log("✅ finalizeWebM completed with me.chunks, blob size:", blob.size);
            const ok = await me.validateWebMHeader(blob);
            if (!ok) {
              console.error("❌ Invalid WebM header - blob corrupted");
              // Update LED to show recording stopped
              return;
            }
            const original_video_end = me.player.playerInfo.currentTime;
            const js_end = Date.now();
            const recorderId = Date.now() + Math.random();
            console.log("🚀 Calling _record_blob_base64 with me.chunks blob...");
            me._record_blob_base64(original_video_end, js_end, recorderId, blob, finalMimeType);
            // Blob processing completed successfully
            // Note: LED will be updated when recording actually stops (when button is clicked again)
            // For now, keep LED on if button is still in "Rec" state
          } catch (err) {
            console.error("❌ Error processing blob with me.chunks:", err);
            // Update LED to show recording stopped (even on error)
          }
        }
      }
    };
    
    // Attach our handler
    console.log(`   🔍 About to attach handler, current handler:`, this.recorder.onstop?.toString().substring(0, 100));
    this.recorder.onstop = ourOnStopHandler;
    console.log(`   ✅ onstop handler attached, handler type: ${typeof ourOnStopHandler}`);
    console.log(`   Handler function length: ${ourOnStopHandler.toString().length} chars`);
    console.log(`   Handler preview: ${ourOnStopHandler.toString().substring(0, 200)}...`);
    
    // Verify it was set correctly IMMEDIATELY
    const handlerAfterSet = this.recorder.onstop;
    console.log(`   🔍 Handler after setting:`, handlerAfterSet?.toString().substring(0, 100));
    console.log(`   🔍 Handler reference match: ${handlerAfterSet === ourOnStopHandler}`);
    
    if (this.recorder.onstop !== ourOnStopHandler) {
      console.error(`   ❌ CRITICAL: onstop handler was not set correctly!`);
      console.error(`   Expected handler length: ${ourOnStopHandler.toString().length}`);
      console.error(`   Expected handler preview: ${ourOnStopHandler.toString().substring(0, 200)}...`);
      console.error(`   Actual handler: ${this.recorder.onstop?.toString().substring(0, 200)}...`);
      // Force set it again
      this.recorder.onstop = ourOnStopHandler;
      console.log(`   🔄 Force re-attached onstop handler`);
            } else {
      console.log(`   ✅ Handler verified - it's our handler!`);
    }
    
    // Store handler reference on the recorder object itself for debugging
    this.recorder._ourOnStopHandler = ourOnStopHandler;
    console.log(`   🔍 Stored handler reference on recorder._ourOnStopHandler`);
    
    // Double-check after a short delay to see if it gets overridden
            setTimeout(() => {
      if (this.recorder) {
        const currentHandler = this.recorder.onstop;
        console.log(`   🔍 Checking handler after 100ms delay...`);
        console.log(`   Current handler: ${currentHandler?.toString().substring(0, 100)}...`);
        console.log(`   Our handler: ${ourOnStopHandler.toString().substring(0, 100)}...`);
        console.log(`   Handler match: ${currentHandler === ourOnStopHandler}`);
        if (currentHandler !== ourOnStopHandler) {
          console.warn(`   ⚠️ WARNING: onstop handler was overridden after attachment!`);
          console.warn(`   Re-attaching our handler...`);
          this.recorder.onstop = ourOnStopHandler;
          } else {
          console.log(`   ✅ Handler still intact after 100ms`);
        }
      }
    }, 100);

    // Create shot immediately when starting new session (not waiting for resume)
    // This ensures the shot exists and ID can be set before any blob processing
    let session_id = null;
    let original_video_start = me.player.playerInfo.currentTime;
    let recording_start = 0;
    let js_start = new Date().getTime();
    // eslint-disable-next-line
    let shot = new recording_shot(
      session_id,
      original_video_start,
      recording_start,
      js_start
    );
    let current_recording = me.recording;
    current_recording.add_shot(shot);
    console.log("Created new shot for recording session, opening on server...");
    // openVideoRecordingShot: create recording_shot in database
    me.open_recording_shot(
      current_recording.recording_id,
      original_video_start,
      recording_start,
      js_start
    );
    
    // Start recorder (paused initially)
    // CRITICAL: Final safety check - verify video is still playing before starting recorder
    if (this.player && this.player.getPlayerState) {
      const playerState = this.player.getPlayerState();
      const isPlaying = playerState === YT.PlayerState.PLAYING;
      if (!isPlaying) {
        console.error("❌❌❌ CRITICAL: Video stopped playing before recorder.start() - ABORTING");
        console.error("   Player state:", playerState);
        this.recorder = null;
        this.chunks = null;
        return;
      }
      console.log("   ✅ Final check: Video is playing (state:", playerState, ")");
    }
    
    // CRITICAL: Start the recorder and wait for MediaRecorder to NATURALLY send the first chunk (EBML header)
    // DO NOT call requestData() immediately - let MediaRecorder send the header chunk naturally
    // The timeslice of 200ms ensures chunks are sent regularly, and the first chunk will be the EBML header
    console.log("🔵 [DEBUG] Starting MediaRecorder with timeslice 200ms - waiting for natural first chunk (EBML header)...");
    console.log(`   sessionId=${sessionId}, state before start: ${this.recorder.state}`);
    console.log(`   Chunks before start: ${chunks.length}`);
    this.recorder.start(200);
    console.log(`   ✅ recorder.start() called, new state: ${this.recorder.state}`);
    console.log(`   Waiting for onstart event and first chunk...`);
    
    // Wait for the first chunk to arrive NATURALLY (MediaRecorder will send it automatically)
    // The first chunk from a new MediaRecorder session should ALWAYS be the EBML header
    // We wait for it to arrive naturally rather than forcing it with requestData()
    const waitForFirstChunk = async (attempts = 0, maxAttempts = 60) => {
      if (chunks.length > 0) {
        // First chunk arrived, verify it has valid header
        try {
          const buf = await chunks[0].slice(0, 4).arrayBuffer();
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          console.log(`First chunk collected: ${chunks[0].size} bytes, header: ${header}, valid: ${isValid}`);
          
          if (isValid) {
            // First chunk is valid - continue recording (don't pause!)
            // The recorder will continue until YouTube pauses or ends
            console.log("✅ First chunk validated - EBML header present, continuing recording. Total chunks:", chunks.length);
            console.log("   Recorder will continue until YouTube pauses or ends");
            return; // Success - exit (but recorder keeps running)
          } else {
            // First chunk exists but is NOT the header - this is a problem
            console.error("❌ CRITICAL: First chunk does not have valid WebM header!");
            console.error(`   Header: ${header}, Expected: 1A 45 DF A3`);
            console.error(`   This means the first chunk is a data chunk, not the container header.`);
            console.error(`   This will cause blob corruption. Requesting data to try to get header...`);
            
            // Try requesting data again - maybe we'll get the header chunk
            try {
              this.recorder.requestData();
            } catch (e) {
              console.error("requestData() failed:", e);
            }
            
            // Continue waiting - maybe the header chunk will arrive
            if (attempts < maxAttempts) {
              setTimeout(() => waitForFirstChunk(attempts + 1, maxAttempts), 100);
            } else {
              console.error("❌❌❌ CRITICAL: Valid header chunk never arrived after", maxAttempts * 100, "ms!");
              console.error("   CANNOT PROCEED - blob would be corrupted without EBML header.");
              console.error("   Stopping this session - recording will be lost but server won't receive invalid data.");
              // DO NOT pause - stop the recorder and clear chunks
              try {
                this.recorder.stop();
                this.chunks.length = 0; // Clear corrupted chunks
                console.error("   Recorder stopped and chunks cleared - session aborted");
              } catch (e) {
                console.error("   Error stopping recorder:", e);
              }
              return; // Exit - do not proceed with corrupted session
            }
          }
        } catch (err) {
          console.error("Error reading first chunk header:", err);
          // Continue waiting
          if (attempts < maxAttempts) {
            setTimeout(() => waitForFirstChunk(attempts + 1, maxAttempts), 100);
          } else {
            console.warn("Max attempts reached, pausing anyway");
            this.recorder.pause();
          }
        }
      } else if (attempts < maxAttempts) {
        // First chunk not yet arrived, wait a bit more
        setTimeout(() => waitForFirstChunk(attempts + 1, maxAttempts), 100);
      } else {
        // Max attempts reached - DO NOT proceed without header
        console.error("❌❌❌ CRITICAL: First chunk not collected after", maxAttempts * 100, "ms!");
        console.error("   CANNOT PROCEED - blob would be corrupted without EBML header.");
        console.error("   Stopping this session - recording will be lost but server won't receive invalid data.");
        // DO NOT pause - stop the recorder and clear chunks
        try {
          this.recorder.stop();
          this.chunks.length = 0; // Clear empty chunks
          console.error("   Recorder stopped and chunks cleared - session aborted");
        } catch (e) {
          console.error("   Error stopping recorder:", e);
        }
        return; // Exit - do not proceed without header chunk
      }
    };
    
    // Start waiting for first chunk
    waitForFirstChunk();
  }

  async stopAndProcessCurrentSegment(original_video_end, js_end) {
    // Use current recorder and chunks
    return this.stopAndProcessCurrentSegmentWithChunks(
      this.recorder,
      this.chunks,
      this.recorder.mimeType || this.recorderMimeType || "video/webm",
      original_video_end,
      js_end
    );
  }

  async stopAndProcessCurrentSegmentWithChunks(recorder, chunksRef, mimeType, original_video_end, js_end) {
    const recorderId = Date.now() + Math.random();

    console.log("=== stopAndProcessCurrentSegmentWithChunks called ===");
    console.log(`🛑 STOP AND PROCESS: recorderId=${recorderId}, recorderState=${recorder ? recorder.state : 'null'}, chunks=${chunksRef ? chunksRef.length : 0}, mimeType=${mimeType}`);
    
    // Safety check for 'this' context
    if (!this) {
      console.error("❌ ERROR: 'this' context is undefined in stopAndProcessCurrentSegmentWithChunks!");
      console.error("   This method must be called with .bind(camcorderInstance)");
      throw new Error("stopAndProcessCurrentSegmentWithChunks called without proper 'this' context");
    }
    
    const currentChunks = this.chunks;
    console.log(`   Chunks array reference: ${chunksRef === currentChunks ? "current" : "captured (different from current)"}`);
    console.log(`   Current sessionId: ${this.currentSessionId || 'N/A'}`);
    console.log(`   Chunks array identity check: ${chunksRef === currentChunks ? 'SAME' : 'DIFFERENT - using captured array'}`);
    console.log(`   Original video end: ${original_video_end}, JS end: ${js_end}`);
    
    // Handle empty chunks - request data and wait a bit
    if (!chunksRef || chunksRef.length === 0) {
      console.warn("⚠️ No chunks available - requesting data from recorder...");
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.requestData();
          // Wait a bit for chunks to arrive
          await new Promise(resolve => setTimeout(resolve, 500));
          // Check if we now have chunks
          if (currentChunks && currentChunks.length > 0) {
            console.log(`✅ Got ${currentChunks.length} chunks after requestData, using current chunks`);
            chunksRef = currentChunks;
          }
        } catch (e) {
          console.error("Error requesting data:", e);
        }
      }
      
      // If still no chunks, try to stop and wait
      if ((!chunksRef || chunksRef.length === 0) && recorder && recorder.state !== 'inactive') {
        console.warn("⚠️ Still no chunks - stopping recorder and waiting for onstop...");
        try {
          recorder.stop();
          // Wait for onstop to fire and collect chunks
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (this.chunks && this.chunks.length > 0) {
            console.log(`✅ Got ${this.chunks.length} chunks after stop, using current chunks`);
            chunksRef = this.chunks;
          }
        } catch (e) {
          console.error("Error stopping recorder:", e);
        }
      }
      
      // If still no chunks, we can't proceed
      if (!chunksRef || chunksRef.length === 0) {
        console.error("❌ Cannot finalize - no chunks collected. Recording segment is empty.");
        return;
      }
    }
    
    // DETAILED CHUNK ANALYSIS - Log all chunks before finalization
    console.log(`📊 CHUNK ANALYSIS BEFORE FINALIZATION:`);
    console.log(`   Total chunks: ${chunksRef.length}`);
    if (chunksRef.length > 0) {
      const totalSize = chunksRef.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log(`   Total size: ${totalSize} bytes`);
      console.log(`   Chunk sizes: [${chunksRef.map((c, i) => `chunk${i}=${c.size}`).join(', ')}]`);
      
      // Analyze first chunk in detail
      console.log(`   🔍 FIRST CHUNK DETAILED ANALYSIS:`);
      const firstChunk = chunksRef[0];
      console.log(`      Size: ${firstChunk.size} bytes`);
      console.log(`      Type: ${firstChunk.type || 'unknown'}`);
      
      // Read first 16 bytes of first chunk
      firstChunk.slice(0, 16).arrayBuffer().then(buf => {
        const b = new Uint8Array(buf);
        const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
        console.log(`      First 16 bytes (hex): ${header}`);
        console.log(`      Expected EBML: 1A 45 DF A3`);
        console.log(`      Got: ${header.substring(0, 11)}`);
        console.log(`      Valid WebM header: ${isValid ? '✅ YES' : '❌ NO'}`);
        if (!isValid) {
          console.error(`      ❌ CRITICAL: First chunk does NOT have valid EBML header!`);
          console.error(`      This means the blob will be corrupted.`);
          console.error(`      First chunk starts with: ${header.substring(0, 11)}`);
          console.error(`      This is NOT the WebM container header.`);
        }
      }).catch(err => {
        console.error(`   ❌ Error reading first chunk header:`, err);
      });
      
      // If there are multiple chunks, check if second chunk might have the header
      if (chunksRef.length > 1) {
        console.log(`   🔍 SECOND CHUNK ANALYSIS (in case header is here):`);
        chunksRef[1].slice(0, 4).arrayBuffer().then(buf => {
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          console.log(`      Second chunk first 4 bytes: ${header}, valid: ${isValid}`);
        }).catch(() => {});
      }
    } else {
      console.error(`   ❌ NO CHUNKS IN ARRAY - cannot create blob!`);
    }

    if (!recorder) {
      console.error("Cannot finalize - recorder is null");
      return;
    }

    // Store recorder ID for tracking
    recorder._recorderId = recorderId;
    this.pendingRecorders.push({ recorder, id: recorderId });
    console.log("Added recorder to pending list, total pending:", this.pendingRecorders.length, "recorderId:", recorderId);

    try {
      const { blob, mimeType: finalMimeType } = await this.finalizeWebM(recorder, chunksRef, {
        settleMs: 1000, // Increased from 600ms to 1000ms to ensure all tail chunks arrive
        maxMs: 10000    // Increased from 8000ms to 10000ms
      });

      // Header validation is already done in finalizeWebM, but double-check
      console.log("✅ Blob finalized, double-checking WebM header...");
      const ok = await this.validateWebMHeader(blob);
      if (!ok) {
        throw new Error("Invalid WebM header - blob may be corrupted (validation failed after finalize)");
      }

      console.log("✅ WebM header valid, processing blob...");
      // Mark recorder as processed to prevent duplicate processing in onstop handler
      recorder._blobProcessed = true;
      console.log("   ✅ Marked recorder as processed - onstop handler will skip duplicate finalization");
      
      // Call the record_blob_base64 function stored in the recorder session
      // We need to find it from the current recorder session
      const recordFunc = this._record_blob_base64;
      if (recordFunc) {
        recordFunc(original_video_end, js_end, recorderId, blob, finalMimeType);
      } else {
        throw new Error("record_blob_base64 function not available - recorder session may have been replaced");
      }
    } catch (e) {
      console.error("stopAndProcessCurrentSegmentWithChunks failed:", e);
      console.error("   Error message:", e.message);
      if (e.message && e.message.includes("corrupted") || e.message && e.message.includes("invalid")) {
        console.error("   ❌ Blob was corrupted - NOT sending to server. Recording segment is lost.");
      }
      this.pendingRecorders = this.pendingRecorders.filter(p => p.id !== recorderId);
      console.log("Removed recorder from pending list (error), remaining:", this.pendingRecorders.length);
    }
  }

  resumeRecording() {
    console.log("=== resumeRecording called ===");
    console.log("Current recorder state:", this.recorder ? this.recorder.state : 'no recorder', "isPaused:", this.isPaused);
    console.log("Pending recorders (still processing):", this.pendingRecorders.length);
    
    // CRITICAL: Only start recording if YouTube video is actually playing
    if (this.player && this.player.getPlayerState) {
      const playerState = this.player.getPlayerState();
      const isPlaying = playerState === YT.PlayerState.PLAYING;
      console.log("YouTube player state:", playerState, "isPlaying:", isPlaying);
      
      if (!isPlaying) {
        console.warn("⚠️ Cannot resume recording - YouTube video is not playing. State:", playerState);
        console.warn("   Recording will start automatically when video plays");
        return;
      }
    } else {
      console.warn("⚠️ Cannot check player state - player or getPlayerState not available");
      // Don't start recording if we can't verify the video is playing
      return;
    }
    
    // If recorder is stopped (inactive) and we were paused, start a new session
    if (this.recorder && this.recorder.state === 'inactive' && this.isPaused) {
      console.log("Resuming from pause - waiting for pending recorders to complete, then starting new session");
      
      // Wait for pending recorders to complete before starting a new session
      const checkPendingRecorders = (attempts = 0, maxAttempts = 100) => {
        if (this.pendingRecorders.length === 0) {
          console.log("No pending recorders, starting new session");
          this.isPaused = false;
          this.startNewRecordingSession();
          // Wait for recorder to be created and first chunk to be collected, then resume
          // The waitForFirstChunk can take up to 4 seconds, so we need to wait and retry
          const tryResumeAfterNewSession = (attempts = 0, maxAttempts = 60) => {
            if (this.recorder && this.recorder.state === 'paused') {
              // Recorder is paused - CRITICAL: Verify first chunk has valid EBML header before resuming
              if (this.chunks && this.chunks.length > 0) {
                // Verify first chunk has valid header
                this.chunks[0].slice(0, 4).arrayBuffer().then(buf => {
                  const b = new Uint8Array(buf);
                  const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
                  const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
                  
                  if (isValid) {
                    console.log("✅ First chunk validated before resume - header:", header);
                    // Final check: verify video is still playing before resuming
                    if (this.player && this.player.getPlayerState) {
                      const playerState = this.player.getPlayerState();
                      if (playerState !== YT.PlayerState.PLAYING) {
                        console.warn("⚠️ Video stopped playing before resume - not resuming. State:", playerState);
                        return;
                      }
                    }
                    console.log("Recorder is paused after new session, resuming...");
                    try {
                      this.recorder.resume();
                      console.log("✅ Recorder resumed successfully, state:", this.recorder.state);
                    } catch (e) {
                      console.error("Error resuming recorder:", e);
                      // Retry if error
                      if (attempts < maxAttempts) {
                        setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
                      }
                    }
                  } else {
                    console.error("❌❌❌ CRITICAL: First chunk does NOT have valid EBML header before resume!");
                    console.error("Header:", header, "Expected: 1A 45 DF A3");
                    console.error("CANNOT RESUME - blob would be corrupted. Waiting for valid header...");
                    // Wait a bit more for the header chunk to arrive
                    if (attempts < maxAttempts) {
                      setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
                    } else {
                      console.error("❌ Max attempts reached - first chunk still invalid. Cannot resume safely.");
                    }
                  }
                }).catch(err => {
                  console.error("Error validating first chunk before resume:", err);
                  // Wait and retry
                  if (attempts < maxAttempts) {
                    setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
                  }
                });
              } else {
                // No chunks yet - wait for first chunk
                console.warn("⚠️ Recorder is paused but no chunks collected yet - waiting for first chunk...");
                if (attempts < maxAttempts) {
                  setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
                } else {
                  console.error("❌ Max attempts reached - no chunks collected. Cannot resume safely.");
                }
              }
            } else if (this.recorder && this.recorder.state === 'recording') {
              // Already recording, good
              console.log("✅ Recorder is already recording");
            } else if (this.recorder && this.recorder.state === 'inactive') {
              // Recorder is inactive, might still be starting or waiting for first chunk
              if (attempts < maxAttempts) {
                if (attempts % 10 === 0) {
                  console.log(`Waiting for recorder to be ready... (${attempts}/${maxAttempts})`);
                }
                setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
              } else {
                console.error("Recorder still inactive after", maxAttempts * 100, "ms");
              }
            } else if (!this.recorder) {
              // Recorder not created yet, wait
              if (attempts < maxAttempts) {
                if (attempts % 10 === 0) {
                  console.log(`Waiting for recorder to be created... (${attempts}/${maxAttempts})`);
                }
                setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
              } else {
                console.error("Recorder not created after startNewRecordingSession");
              }
            } else {
              // Unknown state, wait a bit
              if (attempts < maxAttempts) {
                setTimeout(() => tryResumeAfterNewSession(attempts + 1, maxAttempts), 100);
              }
            }
          };
          tryResumeAfterNewSession();
        } else if (attempts < maxAttempts) {
          console.log(`Waiting for ${this.pendingRecorders.length} pending recorder(s) to complete... (${attempts}/${maxAttempts})`);
          setTimeout(() => checkPendingRecorders(attempts + 1, maxAttempts), 100);
        } else {
          console.warn("Timeout waiting for pending recorders, starting new session anyway");
          this.isPaused = false;
          this.startNewRecordingSession();
          setTimeout(() => {
            // Final check: verify video is still playing before resuming
            if (this.player && this.player.getPlayerState) {
              const playerState = this.player.getPlayerState();
              if (playerState !== YT.PlayerState.PLAYING) {
                console.warn("⚠️ Video not playing - not resuming recorder. State:", playerState);
                return;
              }
            }
            if (this.recorder && this.recorder.state === 'paused') {
              this.recorder.resume();
            }
          }, 500);
        }
      };
      
      // Start checking after a short delay
      setTimeout(() => checkPendingRecorders(), 500);
    } else if (this.recorder && this.recorder.state === 'paused') {
      // Recorder is paused - only resume if video is playing
      if (this.player && this.player.getPlayerState) {
        const playerState = this.player.getPlayerState();
        const isPlaying = playerState === YT.PlayerState.PLAYING;
        if (!isPlaying) {
          console.warn("⚠️ Cannot resume paused recorder - YouTube video is not playing. State:", playerState);
          return;
        }
      }
      
      // Recorder is paused - CRITICAL: Verify first chunk has valid EBML header before resuming
      console.log("Recorder is paused, verifying first chunk before resuming...");
      if (this.chunks && this.chunks.length > 0) {
        this.chunks[0].slice(0, 4).arrayBuffer().then(buf => {
          const b = new Uint8Array(buf);
          const header = Array.from(b).map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          const isValid = b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3;
          
          if (isValid) {
            console.log("✅ First chunk validated - header:", header);
            // Final check: verify video is still playing before resuming
            if (this.player && this.player.getPlayerState) {
              const playerState = this.player.getPlayerState();
              if (playerState !== YT.PlayerState.PLAYING) {
                console.warn("⚠️ Video stopped playing before resume - not resuming. State:", playerState);
                return;
              }
            }
            console.log("Resuming recorder...");
            try {
              this.recorder.resume();
              console.log("✅ Recorder resumed successfully");
            } catch (e) {
              console.error("Error resuming recorder:", e);
            }
          } else {
            console.error("❌❌❌ CRITICAL: First chunk does NOT have valid EBML header!");
            console.error("Header:", header, "Expected: 1A 45 DF A3");
            console.error("CANNOT RESUME - blob would be corrupted. This should not happen if waitForFirstChunk completed.");
          }
        }).catch(err => {
          console.error("Error validating first chunk:", err);
        });
      } else {
        console.error("❌ CRITICAL: Recorder is paused but no chunks collected!");
        console.error("CANNOT RESUME - blob would be corrupted. This should not happen if waitForFirstChunk completed.");
      }
    } else if (!this.recorder) {
      // No recorder exists yet - start a new recording session
      // This happens when button is clicked/enabled but video wasn't playing yet
      console.log("🚀 No recorder exists - starting new recording session...");
      this.isPaused = false; // Reset pause state
      this.startNewRecordingSession();
    } else {
      console.warn("Cannot resume recording, state:", this.recorder ? this.recorder.state : 'no recorder', "isPaused:", this.isPaused);
    }
  }


  pauseRecording() {
    // Pause the recorder - this will trigger onpause which stops it to save the segment
    console.log("🔵 [DEBUG] pauseRecording() called");
    console.log("   Recorder exists:", !!this.recorder);
    console.log("   Recorder state:", this.recorder ? this.recorder.state : 'no recorder');
    console.log("   this.chunks length:", this.chunks ? this.chunks.length : 'N/A');
    console.log("   _record_blob_base64 available:", !!this._record_blob_base64);
    console.log("   onpause handler attached:", typeof this.recorder?.onpause === 'function');
    console.log("   onstop handler attached:", typeof this.recorder?.onstop === 'function');
    
    if (this.recorder && this.recorder.state === 'recording') {
      // Check if first chunk has been collected yet
      const hasFirstChunk = this.chunks && this.chunks.length > 0;
      if (!hasFirstChunk) {
        console.warn("   ⚠️ WARNING: Pausing before first chunk arrives!");
        console.warn("   This will prevent the EBML header from being collected.");
        console.warn("   Stopping recorder instead to avoid corrupted blob.");
        // Stop the recorder instead of pausing - this will trigger onstop which will handle empty chunks
        try {
          this.recorder.stop();
          console.log("   ✅ recorder.stop() called (instead of pause) - session will be aborted");
          // Update LED to show recording stopped
          return;
        } catch (e) {
          console.error("   ❌ Error calling recorder.stop():", e);
          return;
        }
      }
      
      console.log("   ✅ Recorder is recording, calling recorder.pause()...");
      try {
        this.recorder.pause();
        console.log("   ✅ recorder.pause() called successfully");
        console.log("   New recorder state:", this.recorder.state);
        console.log("   Waiting for onpause event to fire...");
      } catch (err) {
        console.error("   ❌ Error calling recorder.pause():", err);
      }
    } else {
      console.warn("   ⚠️ Cannot pause recording, state:", this.recorder ? this.recorder.state : 'no recorder');
    }
  }

  stopRecording() {
    if (this.recorder !== null) {
      this.recorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  toString() {
    return `camcorder id is ${this.id}`;
  }
}

// Make available globally (required for script tag loading)
// Note: This file is loaded as a script tag, so ES6 exports don't work
if (typeof window !== 'undefined') {
  window.camcorder = camcorder;
}
