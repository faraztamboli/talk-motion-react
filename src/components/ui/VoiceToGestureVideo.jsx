import React from "react";
import { Modal, Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdFullscreenExit } from "react-icons/md";
import { useSelector } from "react-redux";

function VoiceToGestureVideo(props) {
  const { modelId } = useSelector((state) => state.model);

  const {
    fullScreen,
    setFullScreen,
    toggleFullScreen,
    transcript,
    buttonSize,
    buttonStyle,
    iconSize,
    videoRef,
    startListening,
    stopListening,
    isListening,
    showMessage,
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
            ref={videoRef}
            height="200px"
            className="block w-100p mb-6 bg-black"
            autoPlay
            playsInline
            muted
            controls
          ></video>

          <div className="flex align-items-center" style={{ flexWrap: "wrap" }}>
            {isListening ? (
              <Button
                style={buttonStyle}
                className="mr-10 converter-btns"
                type="primary"
                shape="round"
                size={buttonSize}
                danger
                onClick={stopListening}
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
                onClick={() => {
                  if (modelId) {
                    startListening();
                  } else {
                    showMessage("info", "please select a model");
                  }
                }}
                icon={<SoundFilled size={iconSize} />}
              >
                <span className="">Speak</span>
              </Button>
            )}

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
          ref={videoRef}
          className="block w-100p h-100p mb-6 bg-black"
        ></video>
      )}
    </>
  );
}

export default VoiceToGestureVideo;
