import React from "react";
import { Modal, Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdOutlineReplay, MdFullscreenExit, MdClear } from "react-icons/md";

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
    handleResetTranscript,
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
              setCount((prevCount) => prevCount + 1);
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

            <Tooltip title="Repeat" showArrow={false} placement="bottom">
              <Button
                type="primary"
                className="mr-9 converter-btns"
                shape="circle"
                size="large"
                onClick={handleRepeat}
                icon={<MdOutlineReplay size={24} />}
              />
            </Tooltip>

            <Tooltip title="Reset" showArrow={false} placement="bottom">
              <Button
                type="primary"
                className="mr-9 converter-btns"
                shape="circle"
                size="large"
                onClick={handleResetTranscript}
                icon={<MdClear size={24} />}
              />
            </Tooltip>

            <Tooltip title="Full Screen" showArrow={false} placement="bottom">
              <Button
                type="primary"
                className="converter-btns"
                danger
                shape="circle"
                size="large"
                onClick={toggleFullScreen}
                icon={<MdFullscreenExit size={24} />}
              />
            </Tooltip>
          </div>

          <div className="pt-4">
            <p>{transcript}</p>
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
            setCount((prevCount) => prevCount + 1);
          }}
        ></video>
      )}
    </>
  );
}

export default VoiceToGestureVideo;
