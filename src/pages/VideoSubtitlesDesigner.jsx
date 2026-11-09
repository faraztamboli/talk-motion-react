import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Collapse, Input, notification, Row, Space, Steps, Tabs, Typography } from "antd";
import {
  EditOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  SearchOutlined,
  VideoCameraFilled,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import useRecordingSession from "../features/videoSubtitles/useRecordingSession";
import RecordingStatusIndicator from "../features/videoSubtitles/components/RecordingStatusIndicator";
import ShotTimeline from "../features/videoSubtitles/components/ShotTimeline";
import StatusPanel from "../features/videoSubtitles/components/StatusPanel";
import YouTubeSearch from "../components/ui/YouTubeSearch";
import AIContentGenerator from "../components/ui/AIContentGenerator";
import truncateString, { truncateDescription } from "../utils/truncateString";
import { isValidYouTubeUrl } from "../utils/youtubeUrl";

const { TextArea } = Input;
const { Text, Title } = Typography;

function VideoSubtitlesDesigner() {
  const { recordingId } = useParams();
  const cameraVideoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const {
    engineState,
    shots,
    lastError,
    events,
    recordingDbId,
    videoId,
    videoDuration,
    isArmed,
    loadVideo,
    loadExistingRecording,
    arm,
    disarm,
    retryUpload,
    updateDetails,
    clearError,
  } = useRecordingSession({ cameraVideoRef, playerContainerRef });

  const [youtubeURL, setYoutubeURL] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notifApi, notifContextHolder] = notification.useNotification();

  const debounceTimerRef = useRef(null);
  const updateTimerRef = useRef(null);

  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Surface engine errors as visible notifications (never console-only).
  useEffect(() => {
    if (!lastError) return;
    notifApi.error({
      message: "Recording problem",
      description: lastError.message,
      placement: "topRight",
      duration: 8,
    });
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastError]);

  // Edit mode: load an existing recording once.
  useEffect(() => {
    if (recordingId == null) return;
    loadExistingRecording(recordingId).then((data) => {
      if (!data) return;
      setTitle(data.title);
      setDescription(data.description);
      if (data.youtubeURL) {
        setYoutubeURL(data.youtubeURL);
        loadVideo(data.youtubeURL, data.title, data.description);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  // Debounce cleanup on unmount (camera/player teardown lives in the hook).
  useEffect(
    () => () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(updateTimerRef.current);
    },
    []
  );

  function handleYoutubeURLChange(e) {
    const newURL = e.target.value;
    setYoutubeURL(newURL);
    clearTimeout(debounceTimerRef.current);
    if (isValidYouTubeUrl(newURL)) {
      debounceTimerRef.current = setTimeout(() => {
        loadVideo(newURL, title, description);
      }, 500);
    }
  }

  function scheduleDetailsUpdate(nextTitle, nextDescription) {
    if (!recordingDbId) return;
    clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      updateDetails(nextTitle, nextDescription);
    }, 1000);
  }

  function handleVideoSelectFromSearch(url, videoTitle, videoDescription) {
    const truncatedTitle = truncateString(videoTitle);
    const truncatedDescription = truncateDescription(videoDescription);
    const nextTitle = title || truncatedTitle || "";
    const nextDescription = description || truncatedDescription || "";
    setYoutubeURL(url);
    if (!title && truncatedTitle) setTitle(truncatedTitle);
    if (!description && truncatedDescription) setDescription(truncatedDescription);
    loadVideo(url, nextTitle, nextDescription);
  }

  // Banner state combines engine state with upload activity.
  const bannerState = useMemo(() => {
    if (engineState === "recording" || engineState === "error") return engineState;
    if (shots.some((s) => s.status === "uploading")) return "uploading";
    if (engineState === "armed") return "armed";
    if (shots.length > 0 && shots.every((s) => s.status === "saved" || s.status === "discarded"))
      return "saved";
    return engineState;
  }, [engineState, shots]);

  const currentStep = videoId ? (shots.length > 0 ? 2 : 1) : 0;
  const cameraOn = engineState !== "idle";

  return (
    <div className="layout-bg mh-100vh" style={{ maxWidth: "100%", width: "100%", margin: "0 auto", padding: "24px 5%" }}>
      {notifContextHolder}
      <Title level={2} style={{ marginBottom: 8 }}>
        Video Subtitle Designer
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, display: "block" }}>
        Record sign language interpretation synchronized with YouTube videos
      </Text>

      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={[
            { title: "Select Video", description: "Choose a YouTube video", icon: <PlayCircleOutlined /> },
            { title: "Record", description: "Record your interpretation", icon: <VideoCameraOutlined /> },
            { title: "Add Details", description: "Title and description", icon: <EditOutlined /> },
          ]}
        />
      </Card>

      {/* Step 1: video selection */}
      <Card
        title={
          <Space>
            <PlayCircleOutlined />
            <span>Step 1: Select YouTube Video</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Tabs
          defaultActiveKey="search"
          size="large"
          items={[
            {
              label: (
                <span>
                  <SearchOutlined /> Search YouTube
                </span>
              ),
              key: "search",
              children: youtubeApiKey ? (
                <YouTubeSearch apiKey={youtubeApiKey} onVideoSelect={handleVideoSelectFromSearch} showSearch />
              ) : (
                <div style={{ padding: 20, textAlign: "center", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4 }}>
                  <Text type="warning">
                    YouTube search is not configured. Please set VITE_YOUTUBE_API_KEY in your environment variables.
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    You can still use the &quot;Paste URL&quot; tab to add videos manually.
                  </Text>
                </div>
              ),
            },
            {
              label: (
                <span>
                  <LinkOutlined /> Paste URL
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
                    status={youtubeURL && !isValidYouTubeUrl(youtubeURL) ? "error" : undefined}
                    aria-label="YouTube video URL"
                    aria-describedby="url-help-text"
                  />
                  <Text type="secondary" id="url-help-text" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                    {youtubeURL && !isValidYouTubeUrl(youtubeURL)
                      ? "This does not look like a YouTube video link yet."
                      : "Copy the URL from your browser's address bar when viewing a YouTube video"}
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Step 2: recording */}
      <Card
        title={
          <Space>
            <VideoCameraOutlined />
            <span>Step 2: Record Your Interpretation</span>
          </Space>
        }
        style={{ marginBottom: 24, display: videoId ? undefined : "none" }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <RecordingStatusIndicator state={bannerState} errorMessage={lastError?.message} />

          <div style={{ textAlign: "center" }}>
            <Button
              type={isArmed ? "default" : "primary"}
              danger={isArmed}
              size="large"
              icon={<VideoCameraFilled />}
              disabled={!cameraOn}
              aria-pressed={isArmed}
              onClick={() => (isArmed ? disarm() : arm())}
            >
              {isArmed ? "Stop recording" : "Enable recording"}
            </Button>
            <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
              {isArmed
                ? "Recording follows the video: play to record, pause to finish a segment."
                : "Enable recording, then play the video to start capturing."}
            </Text>
          </div>

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
                style={{ height: "100%" }}
              >
                {/* The YT API replaces this div with its iframe */}
                <div style={{ width: "100%", minHeight: 390 }}>
                  <div ref={playerContainerRef} />
                </div>
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
                style={{ height: "100%" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 390,
                    background: "#000",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <video
                    ref={cameraVideoRef}
                    className="border-radius-5px"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    playsInline
                    muted
                  />
                  {!cameraOn && (
                    <Text style={{ position: "absolute", color: "#fff" }}>
                      Camera feed will appear here
                    </Text>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Card size="small" title="Recorded segments">
            <ShotTimeline shots={shots} videoDuration={videoDuration} onRetry={retryUpload} />
          </Card>

          <StatusPanel events={events} />
        </Space>
      </Card>

      {/* Step 3: metadata */}
      {videoId && (
        <>
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>Step 3: Add Video Details</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <label htmlFor="video-title" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Video Title
                </label>
                <Input
                  id="video-title"
                  placeholder="Enter a descriptive title for your video"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    scheduleDetailsUpdate(e.target.value, description);
                  }}
                  maxLength={250}
                  aria-label="Video title"
                  showCount
                  size="large"
                />
              </Col>
              <Col xs={24} md={12}>
                <label htmlFor="video-description" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Description
                </label>
                <TextArea
                  id="video-description"
                  placeholder="Add a description to help others understand your video"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    scheduleDetailsUpdate(title, e.target.value);
                  }}
                  maxLength={5000}
                  rows={4}
                  aria-label="Video description"
                  showCount
                />
              </Col>
            </Row>
          </Card>

          {recordingDbId && (
            <Collapse
              items={[
                {
                  key: "ai-assistant",
                  label: (
                    <Space>
                      <RobotOutlined style={{ color: "var(--color-primary)" }} />
                      <Text strong>AI Assistant</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Generate descriptions and summaries with AI
                      </Text>
                    </Space>
                  ),
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <AIContentGenerator
                          targetType="video"
                          targetId={recordingDbId}
                          contentType="description"
                          existingContent={description}
                          onContentApproved={(content) => {
                            setDescription(content);
                            updateDetails(title, content);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <AIContentGenerator
                          targetType="video"
                          targetId={recordingDbId}
                          contentType="summary"
                          existingContent=""
                        />
                      </Col>
                    </Row>
                  ),
                },
              ]}
              style={{ marginBottom: 24 }}
            />
          )}
        </>
      )}

      {!videoId && (
        <Card style={{ textAlign: "center", background: "#f0f2f5" }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            👆 Start by selecting a YouTube video above
          </Text>
        </Card>
      )}
    </div>
  );
}

export default VideoSubtitlesDesigner;
