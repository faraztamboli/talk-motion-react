import React, { useState } from "react";
import { Switch, Spin, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import useSubtitleVideos from "../hooks/useSubtitleVideos";
import useVideoRecording from "../hooks/useVideoRecording";
import SynchronizedVideoPlayer from "../components/ui/SynchronizedVideoPlayer";

function VideoWithSubtitles() {
  const [switchLoading, setSwitchLoading] = useState(false);
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const { updateVideoRecordingPrivacy } = useSubtitleVideos();
  const { recording, loading, error } = useVideoRecording(recordingId);

  const handleVideoPrivacy = (checked) => {
    setSwitchLoading(true);
    updateVideoRecordingPrivacy(recordingId, checked)
      .then((res) => {
        console.log(res);
        message.success(
          checked ? "Video is now public" : "Video is now private"
        );
        setSwitchLoading(false);
      })
      .catch((err) => {
        console.log(err);
        message.error("Failed to update video privacy");
        setSwitchLoading(false);
      });
  };

  const handleEdit = () => {
    navigate(`/video-subtitles/designer/${recordingId}`);
  };

  if (loading) {
    return (
      <div className="layout-bg mh-100vh p-5">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: "16px",
          }}
        >
          <Spin size="large" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout-bg mh-100vh p-5">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: "16px",
          }}
        >
          <p style={{ color: "red" }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-bg mh-100vh p-5">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <Switch
          checkedChildren="Public"
          unCheckedChildren="Private"
          loading={switchLoading}
          onChange={handleVideoPrivacy}
        />
      </div>

      {recording && (
        <SynchronizedVideoPlayer
          recording={recording}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

export default VideoWithSubtitles;
