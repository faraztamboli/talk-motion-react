import React, { useEffect } from "react";
import { Button, Card, Col, Row } from "antd";
import { useParams } from "react-router-dom";
import useVideoWithSlSubtitles from "../hooks/video_subtitles/useVideoWithSlSubtitles";

function VideoWithSubtitles() {
  const {
    injectYouTubeAPIScript,
    loadYouTubeURLOnRecordIdChange,
    enterPip,
    exitPip,
  } = useVideoWithSlSubtitles();

  const videoElement = document.getElementById("camera_video");

  const { recordingId } = useParams();

  useEffect(() => {
    injectYouTubeAPIScript();
    loadYouTubeURLOnRecordIdChange(recordingId);

    return () => {
      exitPip(videoElement);
    };
  }, []);

  return (
    <div className="layout-bg mh-100vh p-5">
      <h2>Video With Subtitles</h2>

      <div>
        <Button className="mr-5" type="primary" onClick={() => enterPip()}>
          Enter Picture in Picture
        </Button>
        <Button danger type="primary" onClick={() => exitPip()}>
          Exit Picture in Picture
        </Button>
      </div>

      <div className="mt-3">
        <Row gutter={[16, 16]}>
          <Col span={12} xs={24} md={12}>
            <Card className="h-100p">
              <div
                src="..."
                id="youtube_video_frame"
                className="w-100p"
                style={{ width: "100%", height: "390px" }}
              ></div>
            </Card>
          </Col>
          <Col span={12} xs={24} md={12}>
            <Card className="h-100p">
              <div id="box" className="w-100p"></div>
              <video
                id="camera_video"
                className="w-100p"
                style={{ width: "100%", height: "390px" }}
              ></video>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default VideoWithSubtitles;
