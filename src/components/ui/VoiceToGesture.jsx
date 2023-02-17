import React from "react";
import { Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdFullscreen } from "react-icons/md";
import VoiceToGestureVideo from "./VoiceToGestureVideo";
import useVoiceToGesture from "../../hooks/useVoiceToGesture";
import { useSelector } from "react-redux";
import useMessageApi from "../../hooks/useMessageApi";

export const VoiceToGesture = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);

  const { startListening, stopListening, isListening, videoRef, transcript } =
    useVoiceToGesture();
  const { contextHolder, showMessage } = useMessageApi();

  const { modelId } = useSelector((state) => state.model);

  const buttonSize = props.md ? "medium" : "large";
  const iconSize = props.md ? 20 : 24;
  const buttonStyle = props.md ? { marginBottom: "1rem" } : null;

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  return (
    <>
      {contextHolder}
      <div style={{ position: "relative" }}>
        <h2 className="mb-0">Voice To Gesture</h2>
        <p>View gestures from speech</p>
        <VoiceToGestureVideo
          transcript={transcript}
          videoRef={videoRef}
          startListening={startListening}
          stopListening={stopListening}
          showMessage={showMessage}
          isListening={isListening}
          fullScreen={fullScreen}
          setFullScreen={setFullScreen}
          toggleFullScreen={toggleFullScreen}
          buttonSize={buttonSize}
          buttonStyle={buttonStyle}
          iconSize={iconSize}
          md={props.md}
          sm={props.sm}
        />
        {fullScreen !== true && (
          <>
            <div
              className="flex flex-center-center"
              style={{ flexWrap: "wrap" }}
            >
              {isListening ? (
                <Button
                  style={buttonStyle}
                  className="mr-6 converter-btns"
                  type="primary"
                  shape="round"
                  size={buttonSize}
                  danger
                  onClick={stopListening}
                  icon={<SoundFilled size={iconSize} />}
                >
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  style={buttonStyle}
                  className="mr-6 converter-btns"
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
                  <span>Speak</span>
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
    </>
  );
};
