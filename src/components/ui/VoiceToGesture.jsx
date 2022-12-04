import React from "react";
import { Button } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdOutlineReplay, MdFullscreen } from "react-icons/md";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import VoiceToGestureVideo from "./VoiceToGestureVideo";

export const VoiceToGesture = () => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const {
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
  } = useSpeechRecognition();

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
      />
      {fullScreen !== true && (
        <>
          <div className="flex align-items-center">
            {isRecording ? (
              <Button
                className="mr-10 converter-btns"
                type="primary"
                shape="round"
                size="large"
                danger
                onClick={handleStopSpeak}
                icon={<SoundFilled size={24} />}
              >
                <span className="">Stop</span>
              </Button>
            ) : (
              <Button
                className="mr-10 converter-btns"
                type="primary"
                shape="round"
                size="large"
                onClick={handleStartSpeak}
                icon={<SoundFilled size={24} />}
              >
                <span className="">Speak</span>
              </Button>
            )}

            <Button
              type="primary"
              className="mr-9 converter-btns"
              shape="circle"
              size="large"
              onClick={handleRepeat}
              icon={<MdOutlineReplay size={24} />}
            />

            <Button
              type="primary"
              className="converter-btns"
              danger
              shape="circle"
              size="large"
              onClick={toggleFullScreen}
              icon={<MdFullscreen size={24} />}
            />
          </div>

          <div className="pt-4">
            <p>
              {transcript ? transcript : "Your Transcript will appear here"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
