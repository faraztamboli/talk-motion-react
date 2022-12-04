import React from "react";
import { Modal, Button } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdOutlineReplay, MdFullscreenExit } from "react-icons/md";

function VoiceToGestureVideo(props) {
  const {
    video,
    setVideo,
    count,
    setCount,
    videoSrc,
    fullScreen,
    setFullScreen,
    toggleFullScreen,
    isRecording,
    handleStartSpeak,
    handleStopSpeak,
    handleRepeat,
    transcript,
  } = props;

  // console.log(fullScreen);

  return (
    <>
      {fullScreen ? (
        <Modal
          title="Voice to Gesture"
          centered
          open={fullScreen}
          onOk={() => setFullScreen(false)}
          onCancel={() => setFullScreen(false)}
          footer={null}
          width={"75%"}
        >
          <video
            src={video && videoSrc(video)}
            // style={!video ? { backgroundColor: "black" } : null}
            controls
            className="block w-100p mb-6"
            autoPlay
            muted
            onEnded={() => {
              if (count == video.length - 1) {
                setCount(0);
                setVideo(null);
                return;
              } else {
                setCount((prevCount) => prevCount + 1);
              }
            }}
          ></video>

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
              icon={<MdFullscreenExit size={24} />}
            />
          </div>

          <div className="pt-4">
            <p>
              {transcript ? transcript : "Your Transcript will appear here"}
            </p>
          </div>
        </Modal>
      ) : (
        <video
          src={video && videoSrc(video)}
          // style={!video || video === null ? { backgroundColor: "black" } : null}
          controls
          className="block w-100p mb-6"
          autoPlay
          muted
          onEnded={() => {
            if (count == video.length - 1) {
              setCount(0);
              setVideo(null);
              return;
            } else {
              setCount((prevCount) => prevCount + 1);
            }
          }}
        ></video>
      )}
    </>
  );
}

export default VoiceToGestureVideo;
