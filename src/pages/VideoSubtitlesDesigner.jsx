import React, { useState, useEffect } from "react";
import { Card, Col, Input, Row } from "antd";
import useSlSubtitleDesigner from "../hooks/video_subtitles/useSlSubtitleDesigner";
import { useParams } from "react-router-dom";
// import YouTube from "react-youtube";

function VideoSubtitlesDesigner() {
  const {
    loadYoutubeURLOnURLChange,
    injectYouTubeAPIScript,
    loadYouTubeURLOnRecordIdChange,
  } = useSlSubtitleDesigner();
  const [youtubeURL, setYoutubeURL] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { recordingId } = useParams();
  console.log(recordingId);

  function handleYoutubeURLChange(e) {
    setYoutubeURL(e.target.value);
    loadYoutubeURLOnURLChange(e.target.value, title, description);
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
  }

  function handleDescriptionChange(e) {
    setDescription(e.target.value);
  }

  useEffect(() => {
    injectYouTubeAPIScript();
    if (recordingId !== undefined) loadYouTubeURLOnRecordIdChange(recordingId);
  }, []);

  return (
    <div className="layout-bg mh-100vh p-5">
      <h2>Video Subtitle Designer</h2>
      <Row className="mt-4">
        <Col className="mr-3">
          <Input
            type="text"
            placeholder="title"
            value={title}
            onChange={handleTitleChange}
          />
        </Col>
        <Col className="mx-3">
          <Input
            type="text"
            placeholder="description"
            value={description}
            onChange={handleDescriptionChange}
          />
        </Col>
        <Col className="mx-3">
          <Input
            type="text"
            placeholder="Youtube Video URL"
            value={youtubeURL}
            onChange={handleYoutubeURLChange}
          />
        </Col>
      </Row>
      <Row className="flex flex-center-center mt-2">
        <Col>
          <button id="recButton" className="record-button"></button>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="">
        <Col span={12} xs={24} md={12}>
          <Card className="h-100p">
            <iframe
              id="youtube_video_frame"
              // width="640"
              // height="390"
              className="border-radius-5px"
              style={{ width: "100%", height: "390px" }}
              src="https://www.youtube.com/embed/aIXOyOLkb24?enablejsapi=1&html5=1"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </Card>
        </Col>
        <Col span={12} xs={24} md={12}>
          <Card className="h-100p">
            <video
              id="camera_video"
              className="bg-black border-radius-5px"
              style={{ width: "100%", height: "390px" }}
            ></video>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default VideoSubtitlesDesigner;
