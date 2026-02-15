import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Space, Slider, Typography, Spin, message } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FullscreenOutlined,
  SoundOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import "./SynchronizedVideoPlayer.css";

const { Title, Text } = Typography;

function SynchronizedVideoPlayer({ recording, onEdit }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(-1);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [subtitleVideo, setSubtitleVideo] = useState(null);

  const youtubeContainerRef = useRef(null);
  const subtitleVideoRef = useRef(null);
  const subtitleVideoElementRef = useRef(null);
  const youtubePlayerRef = useRef(null); // Use ref to access current YouTube player
  const playerContainerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Initialize YouTube Player
  useEffect(() => {
    if (!recording?.youtubeVideoId || !youtubeContainerRef.current) return;

    let playerInstance = null;
    let isMounted = true;

    function initializeYouTubePlayer() {
      if (!youtubeContainerRef.current || !isMounted) return;

      try {
        playerInstance = new window.YT.Player(youtubeContainerRef.current, {
          height: "100%",
          width: "100%",
          videoId: recording.youtubeVideoId,
          playerVars: {
            playsinline: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              console.log("YouTube player ready:", event.target);
              youtubePlayerRef.current = event.target; // Store in ref immediately
              setYoutubePlayer(event.target);
              const duration = event.target.getDuration();
              setDuration(duration || 0);
              console.log("YouTube video duration:", duration);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              console.log("YouTube state changed:", event.data);
              handleYouTubeStateChange(event.data);
            },
          },
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    }

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (originalCallback) originalCallback();
        if (isMounted) {
          initializeYouTubePlayer();
        }
      };
    } else if (window.YT.Player) {
      // API already loaded
      initializeYouTubePlayer();
    } else {
      // API is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          if (isMounted) {
            initializeYouTubePlayer();
          }
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);
    }

    return () => {
      isMounted = false;
      if (playerInstance) {
        try {
          playerInstance.destroy();
        } catch (error) {
          console.error("Error destroying YouTube player:", error);
        }
      }
    };
  }, [recording?.youtubeVideoId]);

  // Callback ref for subtitle video element
  const subtitleVideoCallbackRef = useCallback((videoElement) => {
    if (videoElement) {
      console.log("Subtitle video element mounted:", videoElement);
      subtitleVideoRef.current = videoElement;
      subtitleVideoElementRef.current = videoElement;
      setSubtitleVideo(videoElement);
      console.log("Subtitle video ref set, ready for sync");

      const handleLoadedMetadata = () => {
        console.log("Subtitle video metadata loaded, readyState:", videoElement.readyState);
      };

      const handleError = (e) => {
        const video = e.target;
        console.error("Subtitle video error:", {
          error: e,
          errorCode: video.error?.code,
          errorMessage: video.error?.message,
          src: video.src,
          networkState: video.networkState,
          readyState: video.readyState
        });
        
        // Log specific error codes
        if (video.error) {
          switch(video.error.code) {
            case 1: // MEDIA_ERR_ABORTED
              console.error("Video loading aborted");
              break;
            case 2: // MEDIA_ERR_NETWORK
              console.error("Network error while loading video");
              break;
            case 3: // MEDIA_ERR_DECODE
              console.error("Video decoding error");
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              console.error("Video format not supported or source not found");
              break;
          }
        }
      };

      const handleLoadedData = () => {
        console.log("Subtitle video data loaded");
      };

      // Handle PIP events
      const handleEnterPip = () => {
        console.log("Entered Picture-in-Picture");
        setIsPipActive(true);
      };
      const handleLeavePip = () => {
        console.log("Left Picture-in-Picture");
        setIsPipActive(false);
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("error", handleError);
      videoElement.addEventListener("loadeddata", handleLoadedData);
      videoElement.addEventListener("enterpictureinpicture", handleEnterPip);
      videoElement.addEventListener("leavepictureinpicture", handleLeavePip);

      // Store cleanup function
      subtitleVideoElementRef.current._cleanup = () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.removeEventListener("error", handleError);
        videoElement.removeEventListener("loadeddata", handleLoadedData);
        videoElement.removeEventListener("enterpictureinpicture", handleEnterPip);
        videoElement.removeEventListener("leavepictureinpicture", handleLeavePip);
      };
    } else {
      // Cleanup when element is unmounted
      if (subtitleVideoElementRef.current?._cleanup) {
        subtitleVideoElementRef.current._cleanup();
      }
      subtitleVideoRef.current = null;
      subtitleVideoElementRef.current = null;
      setSubtitleVideo(null);
    }
  }, []);

  // Handle YouTube player state changes
  const handleYouTubeStateChange = useCallback((state) => {
    // YT.PlayerState.PLAYING = 1
    // YT.PlayerState.PAUSED = 2
    // YT.PlayerState.ENDED = 0

    if (state === 1) {
      // Playing
      setIsPlaying(true);
      startSync();
    } else if (state === 2) {
      // Paused
      setIsPlaying(false);
      stopSync();
      if (subtitleVideo) subtitleVideo.pause();
    } else if (state === 0) {
      // Ended
      setIsPlaying(false);
      stopSync();
      if (subtitleVideo) subtitleVideo.pause();
    }
  }, [subtitleVideo]);

  // Play specific subtitle shot
  const playSubtitleShot = useCallback(
    (shotIndex, youtubeTime) => {
      console.log(`playSubtitleShot called: shotIndex=${shotIndex}, youtubeTime=${youtubeTime}`);
      
      if (!subtitleVideo) {
        console.error("playSubtitleShot: subtitleVideo is null");
        return;
      }
      
      if (!recording?.shots?.[shotIndex]) {
        console.error(`playSubtitleShot: shot ${shotIndex} not found`);
        return;
      }

      const shot = recording.shots[shotIndex];
      console.log(`playSubtitleShot: shot data:`, shot);
      
      if (!shot.videoUrl) {
        console.error(`playSubtitleShot: shot ${shotIndex} has no videoUrl`);
        return;
      }

      // If switching to a new shot, load it
      if (subtitleVideo.src !== shot.videoUrl) {
        console.log(`Loading new video: ${shot.videoUrl}`);
        subtitleVideo.src = shot.videoUrl;
        subtitleVideo.load();
        
        // Wait for video to be ready before playing
        const onLoadedData = function() {
          console.log(`Video loaded, readyState: ${subtitleVideo.readyState}`);
          const relativeTime = Math.max(0, youtubeTime - shot.startTime);
          console.log(`Setting currentTime to ${relativeTime}`);
          subtitleVideo.currentTime = relativeTime;
          subtitleVideo.volume = isMuted ? 0 : volume;
          
          subtitleVideo
            .play()
            .then(() => {
              console.log("Subtitle video playing successfully");
            })
            .catch((error) => {
              console.error("Error playing subtitle video:", error);
            });
        };
        
        subtitleVideo.addEventListener('loadeddata', onLoadedData, { once: true });
        
        // Also handle canplay event as fallback
        const onCanPlay = function() {
          console.log(`Video can play, readyState: ${subtitleVideo.readyState}`);
          if (subtitleVideo.paused) {
            const relativeTime = Math.max(0, youtubeTime - shot.startTime);
            subtitleVideo.currentTime = relativeTime;
            subtitleVideo.volume = isMuted ? 0 : volume;
            subtitleVideo.play().catch((error) => {
              console.error("Error playing subtitle video (canplay):", error);
            });
          }
        };
        
        subtitleVideo.addEventListener('canplay', onCanPlay, { once: true });
      } else {
        // Video already loaded, just seek and play
        console.log("Video already loaded, seeking and playing");
        const relativeTime = Math.max(0, youtubeTime - shot.startTime);
        subtitleVideo.currentTime = relativeTime;
        subtitleVideo.volume = isMuted ? 0 : volume;
        
        if (subtitleVideo.readyState >= 2) {
          subtitleVideo
            .play()
            .then(() => {
              console.log("Subtitle video playing (already loaded)");
            })
            .catch((error) => {
              console.error("Error playing subtitle video (already loaded):", error);
            });
        } else {
          console.log(`Video not ready yet, readyState: ${subtitleVideo.readyState}`);
        }
      }
    },
    [subtitleVideo, recording, isMuted, volume]
  );

  // Start synchronization between YouTube and subtitle videos
  const startSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    console.log("Starting sync - YouTube player:", youtubePlayer, "Shots:", recording?.shots?.length, "Subtitle video:", subtitleVideo);

    syncIntervalRef.current = setInterval(() => {
      // Use refs to get current values, fallback to state
      const currentYoutubePlayer = youtubePlayerRef.current || youtubePlayer;
      const currentSubtitleVideo = subtitleVideoRef.current || subtitleVideo;
      
      if (!currentYoutubePlayer || !recording?.shots?.length || !currentSubtitleVideo) {
        if (!currentYoutubePlayer) console.log("Sync: YouTube player not ready");
        if (!recording?.shots?.length) console.log("Sync: No shots available");
        if (!currentSubtitleVideo) console.log("Sync: Subtitle video not ready");
        return;
      }

      try {
        const youtubeTime = currentYoutubePlayer.getCurrentTime();
        if (isNaN(youtubeTime) || youtubeTime === 0) return;
        
        setCurrentTime(youtubeTime);

        // Find the appropriate shot for current time
        // If multiple shots exist at the same time, select the latest one (highest ID)
        let shotIndex = -1;
        let latestShotAtTime = null;
        let latestShotIndex = -1;
        
        // First pass: Find all shots that cover the current time
        for (let i = 0; i < recording.shots.length; i++) {
          const shot = recording.shots[i];
          
          // Check if this shot covers the current time (time is within shot's range)
          if (youtubeTime >= shot.startTime && youtubeTime < shot.endTime) {
            // If multiple shots at same time, keep track of the one with highest ID (latest)
            if (!latestShotAtTime || shot.id > latestShotAtTime.id) {
              latestShotAtTime = shot;
              latestShotIndex = i;
            }
          }
        }
        
        // If we found a shot that covers the time, use it
        if (latestShotIndex !== -1) {
          shotIndex = latestShotIndex;
        } else {
          // Fallback: Find the shot that starts before or at this time and is closest
          // (for edge cases where time is exactly at shot boundary)
          for (let i = recording.shots.length - 1; i >= 0; i--) {
            const shot = recording.shots[i];
            if (youtubeTime >= shot.startTime) {
              shotIndex = i;
              break;
            }
          }
        }

        if (shotIndex !== -1) {
          const shot = recording.shots[shotIndex];
          console.log(`Sync: Found shot ${shotIndex} for time ${youtubeTime}, shot time range: ${shot.startTime}-${shot.endTime}, URL: ${shot.videoUrl}`);
          
          // If switching to a new shot, load it
          if (shotIndex !== currentShotIndex) {
            console.log(`Switching to shot ${shotIndex}`);
            setCurrentShotIndex(shotIndex);
            
            // Inline playSubtitleShot logic to avoid circular dependency
            const shot = recording.shots[shotIndex];
            if (shot && shot.videoUrl && currentSubtitleVideo) {
              if (currentSubtitleVideo.src !== shot.videoUrl) {
                console.log(`Loading new video: ${shot.videoUrl}`);
                currentSubtitleVideo.src = shot.videoUrl;
                currentSubtitleVideo.load();
                
                const onLoadedData = function() {
                  console.log(`Video loaded, readyState: ${currentSubtitleVideo.readyState}`);
                  const relativeTime = Math.max(0, youtubeTime - shot.startTime);
                  console.log(`Setting currentTime to ${relativeTime}`);
                  currentSubtitleVideo.currentTime = relativeTime;
                  currentSubtitleVideo.volume = isMuted ? 0 : volume;
                  currentSubtitleVideo.play().then(() => {
                    console.log("Subtitle video playing successfully");
                  }).catch((error) => {
                    console.error("Error playing subtitle video:", error);
                  });
                };
                
                currentSubtitleVideo.addEventListener('loadeddata', onLoadedData, { once: true });
                
                const onCanPlay = function() {
                  if (currentSubtitleVideo.paused) {
                    const relativeTime = Math.max(0, youtubeTime - shot.startTime);
                    currentSubtitleVideo.currentTime = relativeTime;
                    currentSubtitleVideo.volume = isMuted ? 0 : volume;
                    currentSubtitleVideo.play().catch((error) => {
                      console.error("Error playing subtitle video (canplay):", error);
                    });
                  }
                };
                
                currentSubtitleVideo.addEventListener('canplay', onCanPlay, { once: true });
              } else {
                console.log("Video already loaded, seeking and playing");
                const relativeTime = Math.max(0, youtubeTime - shot.startTime);
                currentSubtitleVideo.currentTime = relativeTime;
                currentSubtitleVideo.volume = isMuted ? 0 : volume;
                if (currentSubtitleVideo.readyState >= 2) {
                  currentSubtitleVideo.play().then(() => {
                    console.log("Subtitle video playing (already loaded)");
                  }).catch((error) => {
                    console.error("Error playing subtitle video (already loaded):", error);
                  });
                }
              }
            }
          } else {
            // Update subtitle video time to stay in sync
            const relativeTime = Math.max(0, youtubeTime - shot.startTime);
            const maxTime = shot.duration || (shot.endTime - shot.startTime);
            
            if (relativeTime <= maxTime) {
              const timeDiff = Math.abs(currentSubtitleVideo.currentTime - relativeTime);
              if (timeDiff > 0.3) {
                currentSubtitleVideo.currentTime = relativeTime;
              }
            }
          }
        } else if (currentShotIndex !== -1) {
          // No shot found for current time, pause subtitle video
          console.log(`No shot found for time ${youtubeTime}`);
          setCurrentShotIndex(-1);
          if (currentSubtitleVideo && !currentSubtitleVideo.paused) {
            currentSubtitleVideo.pause();
          }
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    }, 100); // Check every 100ms for smooth synchronization
  }, [youtubePlayer, recording, currentShotIndex, subtitleVideo, isMuted, volume]);

  const stopSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Update current time display
  useEffect(() => {
    if (!isPlaying) return;

    timeUpdateIntervalRef.current = setInterval(() => {
      if (youtubePlayer) {
        try {
          const time = youtubePlayer.getCurrentTime();
          setCurrentTime(time);
        } catch (error) {
          // YouTube player might not be ready
        }
      }
    }, 100);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isPlaying, youtubePlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSync();
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [stopSync]);

  // Play/Pause handlers
  const handlePlayPause = () => {
    if (!youtubePlayer) return;

    if (isPlaying) {
      youtubePlayer.pauseVideo();
    } else {
      youtubePlayer.playVideo();
    }
  };

  // Seek handler
  const handleSeek = (value) => {
    if (!youtubePlayer) return;

    youtubePlayer.seekTo(value, true);
    setCurrentTime(value);

    // Update subtitle video if needed
    if (recording?.shots?.length && subtitleVideo) {
      const shotIndex = recording.shots.findIndex(
        (shot, index) =>
          value >= shot.startTime &&
          (index === recording.shots.length - 1 ||
            value < recording.shots[index + 1].startTime)
      );

      if (shotIndex !== -1) {
        setCurrentShotIndex(shotIndex);
        playSubtitleShot(shotIndex, value);
      }
    }
  };

  // Volume handlers
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (subtitleVideo) {
      subtitleVideo.volume = isMuted ? 0 : value;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (subtitleVideo) {
      subtitleVideo.volume = !isMuted ? 0 : volume;
    }
  };

  // Picture-in-Picture handlers
  const handleEnterPip = async () => {
    // Try to get video from state first, then from ref
    let video = subtitleVideo;
    if (!video) {
      video = subtitleVideoRef.current;
    }
    
    console.log("PIP request - subtitleVideo state:", subtitleVideo);
    console.log("PIP request - subtitleVideoRef.current:", subtitleVideoRef.current);
    console.log("PIP request - video element:", video);
    console.log("PIP request - video src:", video?.src || video?.currentSrc);
    console.log("PIP request - video readyState:", video?.readyState);
    console.log("PIP request - PIP enabled:", document.pictureInPictureEnabled);
    
    if (!video) {
      console.error("Subtitle video element not found");
      message.warning("Subtitle video not ready. Please wait for the video to load.");
      return;
    }

    if (!document.pictureInPictureEnabled) {
      message.warning("Picture-in-Picture is not supported in your browser");
      return;
    }

    // Check if video has a source
    const videoSrc = video.src || video.currentSrc;
    if (!videoSrc) {
      message.warning("No subtitle video loaded yet. Please wait for the video to start playing.");
      return;
    }

    try {
      // Exit any existing PIP first
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        // Wait a bit before entering new PIP
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Ensure video is ready - need at least metadata
      if (video.readyState < 2) {
        console.log("Waiting for video metadata...");
        // Wait for video to load metadata
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video loading timeout"));
          }, 5000);
          
          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            console.log("Video metadata loaded, readyState:", video.readyState);
            resolve();
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          
          // If already loaded, resolve immediately
          if (video.readyState >= 1) {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          } else {
            video.load();
          }
        });
      }

      // Some browsers require the video to have been played at least once
      // Try to play it briefly if it hasn't been played yet
      if (video.paused && video.currentTime === 0) {
        console.log("Video hasn't been played yet, attempting to play briefly...");
        try {
          await video.play();
          // Play for a brief moment to satisfy browser requirements
          await new Promise(resolve => setTimeout(resolve, 100));
          video.pause();
        } catch (playError) {
          console.log("Could not play video for PIP preparation:", playError);
          // Continue anyway - some browsers don't require this
        }
      }

      console.log("Requesting Picture-in-Picture...");
      await video.requestPictureInPicture();
      console.log("Successfully entered Picture-in-Picture");
    } catch (error) {
      console.error("Error entering PIP:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'NotAllowedError') {
        message.error("Picture-in-Picture request was denied. Please interact with the page first.");
      } else if (error.name === 'InvalidStateError') {
        message.error("Video is not in a valid state for Picture-in-Picture. Try playing the video first.");
      } else if (error.name === 'NotSupportedError') {
        message.error("Picture-in-Picture is not supported for this video.");
      } else {
        message.error(`Failed to enter Picture-in-Picture: ${error.message || error.name}`);
      }
    }
  };

  const handleExitPip = async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        console.log("Successfully exited Picture-in-Picture");
      } catch (error) {
        console.error("Error exiting PIP:", error);
        message.error("Failed to exit Picture-in-Picture mode");
      }
    }
  };

  // Fullscreen handler
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Debug: Log recording data when it changes
  useEffect(() => {
    if (recording) {
      console.log("Recording loaded:", {
        id: recording.id,
        title: recording.title,
        youtubeVideoId: recording.youtubeVideoId,
        shotsCount: recording.shots?.length || 0,
        shots: recording.shots
      });
    }
  }, [recording]);

  if (!recording) {
    return (
      <div className="synchronized-video-player-loading">
        <Spin size="large" />
        <Text>Loading video...</Text>
      </div>
    );
  }

  return (
    <div className="synchronized-video-player" ref={playerContainerRef}>
      <div className="video-player-header">
        <Title level={4} className="video-title">
          {recording.title}
        </Title>
        {onEdit && (
          <Button type="primary" onClick={onEdit}>
            Edit Video
          </Button>
        )}
      </div>

      <div className="video-container">
        <div className="youtube-video-wrapper">
          <div
            ref={youtubeContainerRef}
            className="youtube-player"
            id="youtube-player-container"
          />
        </div>

        <div 
          className="subtitle-video-wrapper" 
          style={{ 
            visibility: recording.shots && recording.shots.length > 0 ? 'visible' : 'hidden',
            opacity: recording.shots && recording.shots.length > 0 ? 1 : 0
          }}
        >
          <video
            ref={subtitleVideoCallbackRef}
            className="subtitle-video"
            playsInline
            muted={isMuted}
            volume={volume}
            preload="auto"
          />
          {currentShotIndex === -1 && recording.shots && recording.shots.length > 0 && (
            <div className="subtitle-placeholder">
              <Text type="secondary" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                Sign language subtitles will appear here
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="video-controls">
        <Space size="middle" className="controls-left">
          <Button
            type="text"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause}
            size="large"
          />
          <div className="volume-control">
            <Button
              type="text"
              icon={<SoundOutlined />}
              onClick={handleMuteToggle}
              style={{ opacity: isMuted ? 0.5 : 1 }}
              title={isMuted ? "Unmute" : "Mute"}
            />
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: 100 }}
            />
          </div>
        </Space>

        <div className="progress-control">
          <Text className="time-display">{formatTime(currentTime)}</Text>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            tooltip={{ formatter: formatTime }}
            style={{ flex: 1, margin: "0 16px" }}
          />
          <Text className="time-display">{formatTime(duration)}</Text>
        </div>

        <Space size="middle" className="controls-right">
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            onClick={isPipActive ? handleExitPip : handleEnterPip}
            title={isPipActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
            disabled={!subtitleVideo || (!subtitleVideo.src && !subtitleVideo.currentSrc)}
          />
          <Button
            type="text"
            icon={<FullscreenOutlined />}
            onClick={handleFullscreen}
            title="Fullscreen"
          />
        </Space>
      </div>

      {recording.shots?.length > 0 && (
        <div className="shots-info">
          <Text type="secondary">
            {recording.shots.length} subtitle segment
            {recording.shots.length !== 1 ? "s" : ""} available
          </Text>
        </div>
      )}
    </div>
  );
}

export default SynchronizedVideoPlayer;

