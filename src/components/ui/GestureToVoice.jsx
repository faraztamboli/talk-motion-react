import React, { useEffect } from "react";
import { Button, Tooltip } from "antd";
import { MdPause, MdPlayArrow, MdFullscreen } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useLeapMotion from "../../hooks/useLeapMotion";
// import useHolisticModel from "../../hooks/useHolisticModel";
import useHolisticModel1 from "../../hooks/useHolisticModel1";

export const GestureToVoice = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  // const { videoElement, canvasElement, controlsElement } = useHolisticModel();
  const { getComponentDetails } = useLeapMotion();
  const { webcamRef, canvasRef, spinner, spinnerParentDiv } =
    useHolisticModel1();

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    getComponentDetails(isPaused, false, props.modalId, "");
  }, [isPaused]);

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const iconSize = props.md ? 20 : 24;
  const buttonSize = props.md ? "medium" : "large";
  const buttonStyle = props.md ? { marginBottom: "1rem" } : null;

  return (
    <div>
      <h2 className="mb-0">Gesture to Voice</h2>
      <p>generate speech from gestures</p>
      <GestureCanvs
        fullScreen={fullScreen}
        webcamRef={webcamRef}
        canvasRef={canvasRef}
        spinner={spinner}
        spinnerParentDiv={spinnerParentDiv}
        // videoElement={videoElement}
        // canvasElement={canvasElement}
        // controlsElement={controlsElement}
        setFullScreen={setFullScreen}
        toggleFullScreen={toggleFullScreen}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        togglePause={togglePause}
        iconSize={iconSize}
        buttonSize={buttonSize}
        buttonStyle={buttonStyle}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPaused ? (
          <Button
            className="mr-6 converter-btns"
            type="primary"
            shape="circle"
            style={{ backgroundColor: "#DDBA00" }}
            size="large"
            danger
            onClick={() => togglePause()}
            icon={<MdPause size={24} />}
          ></Button>
        ) : (
          <Button
            className="mr-6 converter-btns"
            type="primary"
            shape="circle"
            size="large"
            onClick={() => togglePause()}
            icon={<MdPlayArrow size={24} />}
          ></Button>
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
      {props.from === "converter" && <p>Lorem ipsum dolor sit</p>}
    </div>
  );
};
