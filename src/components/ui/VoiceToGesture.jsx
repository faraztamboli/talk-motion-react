import React from "react";
import { Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdOutlineReplay, MdFullscreen, MdClear } from "react-icons/md";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import VoiceToGestureVideo from "./VoiceToGestureVideo";

export const VoiceToGesture = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const {
    loading,
    transcript,
    video,
    setVideo,
    count,
    setCount,
    videoSrc,
    isRecording,
    handleStartSpeak,
    handleStopSpeak,
    handleRepeat,
    handleResetTranscript,
  } = useSpeechRecognition();

  const buttonSize = props.md ? "medium" : "large";
  const iconSize = props.md ? 20 : 24;
  const buttonStyle = props.md ? { marginBottom: "1rem" } : null;

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
    if (count !== 0) {
      setVideo(video);
    } else {
      handleRepeat();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <h2 className="mb-0">Voice To Gesture</h2>
      <p>View gestures from speech</p>
      <VoiceToGestureVideo
        loading={loading}
        video={video}
        setVideo={setVideo}
        count={count}
        setCount={setCount}
        videoSrc={videoSrc}
        fullScreen={fullScreen}
        setFullScreen={setFullScreen}
        isRecording={isRecording}
        handleStartSpeak={handleStartSpeak}
        handleStopSpeak={handleStopSpeak}
        toggleFullScreen={toggleFullScreen}
        transcript={transcript}
        handleRepeat={handleRepeat}
        handleResetTranscript={handleResetTranscript}
        buttonSize={buttonSize}
        buttonStyle={buttonStyle}
        iconSize={iconSize}
        md={props.md}
        sm={props.sm}
      />
      {fullScreen !== true && (
        <>
          <div className="flex align-items-center" style={{ flexWrap: "wrap" }}>
            {isRecording ? (
              <Button
                style={buttonStyle}
                className="mr-6 converter-btns"
                type="primary"
                shape="round"
                size={buttonSize}
                danger
                onClick={handleStopSpeak}
                icon={<SoundFilled size={iconSize} />}
              >
                <span className="">Stop</span>
              </Button>
            ) : (
              <Button
                style={buttonStyle}
                className="mr-6 converter-btns"
                type="primary"
                shape="round"
                size={buttonSize}
                onClick={handleStartSpeak}
                icon={<SoundFilled size={iconSize} />}
              >
                <span className="">Speak</span>
              </Button>
            )}

            <Tooltip title="Repeat" showArrow={false} placement="bottom">
              <Button
                style={buttonStyle}
                type="primary"
                className="mr-6 converter-btns"
                shape="circle"
                size={buttonSize}
                onClick={video && video.length !== 0 && handleRepeat}
                icon={<MdOutlineReplay size={iconSize} />}
              />
            </Tooltip>

            <Tooltip title="Reset" showArrow={false} placement="bottom">
              <Button
                style={buttonStyle}
                type="primary"
                className="mr-6 converter-btns"
                shape="circle"
                size={buttonSize}
                onClick={handleResetTranscript}
                icon={<MdClear size={iconSize} />}
              />
            </Tooltip>

            <Tooltip title="Full Screen" showArrow={false} placement="bottom">
              <Button
                style={buttonStyle}
                type="primary"
                className="converter-btns"
                danger
                shape="circle"
                size={buttonSize}
                onClick={toggleFullScreen}
                icon={<MdFullscreen size={iconSize} />}
              />
            </Tooltip>
          </div>

          <div className="pt-4">
            <p>{transcript ? transcript : "Transcript"}</p>
          </div>
        </>
      )}
    </div>
  );
};
