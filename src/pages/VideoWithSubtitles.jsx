import React, { useEffect } from "react";
import { Button, Card, Col, Row } from "antd";
import { useParams } from "react-router-dom";
import useVideoWithSlSubtitles from "../hooks/video_subtitles/useVideoWithSlSubtitles";

function VideoWithSubtitles() {
  const {
    state,
    injectYouTubeAPIScript,
    loadYouTubeURLOnRecordIdChange,
    on_ready_callback,
    on_player_state_changed_callback,
    enterPip,
    exitPip,
  } = useVideoWithSlSubtitles();

  const { recordingId } = useParams();

  useEffect(() => {
    injectYouTubeAPIScript();
    loadYouTubeURLOnRecordIdChange(recordingId);
    state.set_is_recorder(false);
    state.set_on_ready_callback(on_ready_callback);
    state.set_on_player_state_changed_callback(
      on_player_state_changed_callback
    );
    state.set_in_pip(true);

    return () => {
      exitPip();
    };
  }, []);

  return (
    <div className="layout-bg mh-100vh p-5">
      <h2>Video With Subtitles</h2>

      <div>
        <Button className="mr-5" type="primary" onClick={enterPip}>
          Enter Picture in Picture
        </Button>
        <Button danger type="primary" onClick={exitPip}>
          Exit Picture in Picture
        </Button>
      </div>

      <div className="mt-3">
        <Row gutter={[16, 16]}>
          <Col span={12} xs={24} md={12}>
            <Card className="h-100p">
              <iframe
                src="..."
                id="youtube_video_frame"
                className="w-100p"
                style={{ width: "100%", height: "390px" }}
              ></iframe>
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
