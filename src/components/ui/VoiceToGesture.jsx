import React from "react";
import { Button } from "antd";
import { FaMicrophoneAlt, FaRegStopCircle } from "react-icons/fa";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import VoiceToGestureVideo from "./VoiceToGestureVideo";

export const VoiceToGesture = () => {
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
  } = useSpeechRecognition();

  return (
    <div>
      <h2 className="mb-0">Voice To Gesture</h2>
      <p>View gestures from speech</p>
      <VoiceToGestureVideo
        video={video}
        setVideo={setVideo}
        count={count}
        setCount={setCount}
        videoSrc={videoSrc}
      />
      {isRecording ? (
        <Button
          className="flex w-100p flex-center-center"
          type="primary"
          danger
          // loading={loadings[0]}
          onClick={handleStopSpeak}
          icon={<FaRegStopCircle />}
        >
          <span className="">Stop</span>
        </Button>
      ) : (
        <Button
          className="flex w-100p flex-center-center"
          type="primary"
          // loading={loadings[1]}
          // onClick={() => speak(1)}
          onClick={handleStartSpeak}
          icon={<FaMicrophoneAlt />}
        >
          <span className="">Speak</span>
        </Button>
      )}

      <div className="pt-4">
        <p>{transcript}</p>
      </div>
    </div>
  );
};
