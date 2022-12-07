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
    buttonSize,
    buttonStyle,
    iconSize,
  } = props;

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
          width={props.md ? "100%" : "75%"}
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

          <div className="flex align-items-center" style={{ flexWrap: "wrap" }}>
            {isRecording ? (
              <Button
                style={buttonStyle}
                className="mr-10 converter-btns"
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
                className="mr-10 converter-btns"
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
                className="mr-9 converter-btns"
                shape="circle"
                size={buttonSize}
                onClick={handleRepeat}
                icon={<MdOutlineReplay size={iconSize} />}
              />
            </Tooltip>

            <Tooltip title="Reset" showArrow={false} placement="bottom">
              <Button
                style={buttonStyle}
                type="primary"
                className="mr-9 converter-btns"
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
                icon={<MdFullscreenExit size={iconSize} />}
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
