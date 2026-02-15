import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, Col, Input, Row, Tabs, Typography, Steps, Space } from "antd";
const { TextArea } = Input;
import { LinkOutlined, SearchOutlined, PlayCircleOutlined, VideoCameraOutlined, EditOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import useSlSubtitleDesigner from "../hooks/video_subtitles/useSlSubtitleDesigner";
import YouTubeSearch from "../components/ui/YouTubeSearch";
import truncateString, { truncateDescription } from "../utils/truncateString";
// Make UploadManager available globally for camcorder.js (loaded as script tag)
import { uploadManager, UploadManager } from "../utils/UploadManager";
if (typeof window !== 'undefined') {
  window.UploadManager = UploadManager;
  window.uploadManager = uploadManager;
}
// import YouTube from "react-youtube";

const { Text, Title } = Typography;

function VideoSubtitlesDesigner() {
  const { loadYoutubeURLOnURLChange, injectYouTubeAPIScript, loadYouTubeURLOnRecordIdChange, initializeRecordingStateVariable, updateRecordingTitleAndDescription } =
    useSlSubtitleDesigner();
  const [youtubeURL, setYoutubeURL] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const recButtonRef = useRef(null);

  // Get YouTube API key from environment variable
  // You'll need to set this in your .env file: VITE_YOUTUBE_API_KEY=your_api_key_here
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Validate YouTube URL
  const isValidYouTubeURL = useCallback((url) => {
    if (!url || url.trim().length === 0) return false;
    // Check if it's a valid YouTube URL pattern
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]{11}/;
    return youtubeRegex.test(url);
  }, []);

  // Debounce timer refs
  const debounceTimerRef = useRef(null);
  const updateTimerRef = useRef(null);

  function handleYoutubeURLChange(e) {
    const newURL = e.target.value;
    setYoutubeURL(newURL);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only process if URL is valid and complete
    if (isValidYouTubeURL(newURL)) {
      // Debounce the call to avoid processing while user is still typing
      debounceTimerRef.current = setTimeout(() => {
        loadYoutubeURLOnURLChange(newURL, title, description);
      }, 500); // Wait 500ms after user stops typing
    }
  }

  function handleTitleChange(e) {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // If editing an existing recording, update it after a delay
    if (recordingId) {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        updateRecordingTitleAndDescription(newTitle, description);
      }, 1000); // Wait 1 second after user stops typing
    }
  }

  function handleDescriptionChange(e) {
    const newDescription = e.target.value;
    setDescription(newDescription);
    
    // If editing an existing recording, update it after a delay
    if (recordingId) {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        updateRecordingTitleAndDescription(title, newDescription);
      }, 1000); // Wait 1 second after user stops typing
    }
  }

  function handleVideoSelectFromSearch(url, videoTitle, videoDescription) {
    setYoutubeURL(url);
    // Auto-fill title and description if empty
    // Truncate title to prevent database errors (250 chars for VARCHAR)
    const truncatedTitle = truncateString(videoTitle);
    // Truncate description to YouTube's limit (5000 chars, TEXT column can handle more but YouTube caps at 5000)
    const truncatedDescription = truncateDescription(videoDescription);
    if (!title && truncatedTitle) {
      setTitle(truncatedTitle);
    }
    if (!description && truncatedDescription) {
      setDescription(truncatedDescription);
    }
    loadYoutubeURLOnURLChange(url, title || truncatedTitle, description || truncatedDescription);
  }

  const { recordingId } = useParams();

  useEffect(() => {
    injectYouTubeAPIScript();
    
    // Initialize recording state when button is available
    // Use a function to check and initialize with max retries
    let retryCount = 0;
    const maxRetries = 50; // 50 * 100ms = 5 seconds max wait
    
    const initRecordingButton = () => {
      const button = document.getElementById("recButton");
      if (button) {
        initializeRecordingStateVariable();
      } else if (retryCount < maxRetries) {
        retryCount++;
        // Retry after a short delay if button not found
        setTimeout(initRecordingButton, 100);
      } else {
        console.warn("Recording button not found after max retries. It will be initialized when the button is rendered.");
      }
    };
    
    // Start initialization check
    const initTimer = setTimeout(initRecordingButton, 100);
    
    if(recordingId !== undefined && recordingId !== null) {
        loadYouTubeURLOnRecordIdChange(recordingId, (data) => {
          // Update React state with loaded recording data
          if (data.title) setTitle(data.title);
          if (data.description) setDescription(data.description);
          if (data.youtubeURL) setYoutubeURL(data.youtubeURL);
        });
    }
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(initTimer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);
  
  // Also initialize when button becomes available (e.g., when youtubeURL is set)
  useEffect(() => {
    if (youtubeURL) {
      // Button should be rendered now, try to initialize
      const button = document.getElementById("recButton");
      // Check if button exists and if it's not already initialized
      // Initialized buttons will have either "notRec" or "Rec" class
      const isAlreadyInitialized = button && (button.classList.contains("notRec") || button.classList.contains("Rec"));
      
      if (button && !isAlreadyInitialized) {
        // Button exists but not initialized yet
        initializeRecordingStateVariable();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeURL]);

  // Determine current step based on state
  const getCurrentStep = () => {
    if (youtubeURL) return 1; // Video selected
    return 0; // No video selected
  };

  return (
    <div className="layout-bg mh-100vh" style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '24px 5%' }}>
      <Title level={2} style={{ marginBottom: '8px' }}>Video Subtitle Designer</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        Record sign language gestures synchronized with YouTube videos
      </Text>

      {/* Step Indicator */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps
          current={getCurrentStep()}
          items={[
            {
              title: 'Select Video',
              description: 'Choose a YouTube video',
              icon: <PlayCircleOutlined />,
            },
            {
              title: 'Record',
              description: 'Record your gestures',
              icon: <VideoCameraOutlined />,
            },
            {
              title: 'Add Details',
              description: 'Title and description',
              icon: <EditOutlined />,
            },
          ]}
        />
      </Card>

      {/* Step 1: YouTube Video Selection */}
      <Card 
        title={
          <Space>
            <PlayCircleOutlined />
            <span>Step 1: Select YouTube Video</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Tabs 
          defaultActiveKey="search" 
          size="large"
          items={[
            {
              label: (
                <span>
                  <SearchOutlined />
                  Search YouTube
                </span>
              ),
              key: "search",
              children: (
                <div>
                  {youtubeApiKey ? (
                    <YouTubeSearch
                      apiKey={youtubeApiKey}
                      onVideoSelect={handleVideoSelectFromSearch}
                      showSearch={true}
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
                      <Text type="warning">
                        YouTube search is not configured. Please set VITE_YOUTUBE_API_KEY in your environment variables.
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        You can still use the "Paste URL" tab to add videos manually.
                      </Text>
                    </div>
                  )}
                </div>
              ),
            },
            {
              label: (
                <span>
                  <LinkOutlined />
                  Paste URL
                </span>
              ),
              key: "url",
              children: (
                <div>
                  <Input
                    id="youtube-url"
                    type="text"
                    placeholder="Paste YouTube Video URL here (e.g., https://www.youtube.com/watch?v=...)"
                    value={youtubeURL}
                    onChange={handleYoutubeURLChange}
                    size="large"
                    aria-label="YouTube video URL"
                    aria-describedby="url-help-text"
                  />
                  <Text type="secondary" id="url-help-text" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    Copy the URL from your browser's address bar when viewing a YouTube video
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Step 2: Recording Area */}
      {youtubeURL && (
        <Card 
          title={
            <Space>
              <VideoCameraOutlined />
              <span>Step 2: Record Your Gestures</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Recording Button - Prominent placement */}
            <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>
                Click the record button to start/stop recording
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                {/* Red LED Indicator */}
                <div 
                  id="recording-led"
                  className="recording-led recording-inactive"
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#666',
                    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  aria-label="Recording status indicator"
                  role="status"
                ></div>
                
                {/* Recording Toggle Button */}
                <button 
                  id="recButton" 
                  ref={recButtonRef}
                  className="record-button" 
                  title="Click to toggle recording on/off"
                  aria-label="Toggle recording"
                  style={{ 
                    transform: 'scale(1.5)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                ></button>
              </div>
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                Red LED indicates recording status
              </Text>
            </div>

            {/* Video Players */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <PlayCircleOutlined />
                      <span>YouTube Video</span>
                    </Space>
                  }
                  style={{ height: '100%' }}
                >
                  <iframe
                    id="youtube_video_frame"
                    className="border-radius-5px"
                    style={{ width: "100%", height: "390px", border: 'none' }}
                    src="https://www.youtube.com/embed/aIXOyOLkb24?enablejsapi=1&html5=1"
                    frameBorder="0"
                    allowFullScreen
                    title="YouTube video player"
                  ></iframe>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <VideoCameraOutlined />
                      <span>Your Recording</span>
                    </Space>
                  }
                  style={{ height: '100%' }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '390px', background: '#000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video
                      id="camera_video"
                      className="border-radius-5px"
                      style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                      playsInline
                    ></video>
                    {!youtubeURL && (
                      <Text type="secondary" style={{ position: 'absolute', color: '#fff' }}>
                        Camera feed will appear here when recording
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>
      )}

      {/* Step 3: Metadata */}
      {youtubeURL && (
        <Card 
          title={
            <Space>
              <EditOutlined />
              <span>Step 3: Add Video Details</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <label htmlFor="video-title" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Video Title
                </label>
                <Input
                  id="video-title"
                  type="text"
                  placeholder="Enter a descriptive title for your video"
                  value={title}
                  onChange={handleTitleChange}
                  maxLength={250}
                  aria-label="Video title"
                  showCount
                  size="large"
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  This title will be used to identify your recording
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <label htmlFor="video-description" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <TextArea
                  id="video-description"
                  placeholder="Add a description to help others understand your video"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={5000}
                  rows={4}
                  aria-label="Video description"
                  showCount
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Optional: Provide context or additional information about your recording
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Helper text when no video is selected */}
      {!youtubeURL && (
        <Card style={{ textAlign: 'center', background: '#f0f2f5' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            👆 Start by selecting a YouTube video above
          </Text>
        </Card>
      )}
    </div>
  );
}

export default VideoSubtitlesDesigner;
