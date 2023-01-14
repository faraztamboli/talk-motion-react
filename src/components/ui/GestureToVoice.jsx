import React from "react";
import { Button, Slider, Tooltip } from "antd";
import { MdPause, MdPlayArrow, MdFullscreen } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useHolisticModel1 from "../../hooks/useHolisticModel1";
import { useDispatch } from "react-redux";
import { setVolume } from "../../app/features/speechSlice";

export const GestureToVoice = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const [isPageActive, setIsPageActive] = React.useState(false);
  const [isPlayed, setIsPlayed] = React.useState(false);

  const dispatch = useDispatch();

  const {
    webcamRef,
    canvasRef,
    spinner,
    spinnerParentDiv,
    startHolisticModel,
  } = useHolisticModel1();

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const onVolumeChange = (value) => {
    value = (value / 20) * 1;
    console.log(value);
    dispatch(setVolume(value));
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
        setFullScreen={setFullScreen}
        toggleFullScreen={toggleFullScreen}
        isPlayed={isPlayed}
        setIsPlayed={setIsPlayed}
        togglePause={togglePlayed}
        iconSize={iconSize}
        buttonSize={buttonSize}
        buttonStyle={buttonStyle}
        isPageActive={isPageActive}
        setIsPageActive={setIsPageActive}
      />
      <Slider defaultValue={10} max={20} onChange={onVolumeChange} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPlayed ? (
          <Button
            className="mr-6 converter-btns"
            type="primary"
            shape="circle"
            style={{ backgroundColor: "#DDBA00" }}
            size="large"
            danger
            onClick={() => {
              togglePlayed();
              setIsPageActive(false);
            }}
            icon={<MdPause size={24} />}
          ></Button>
        ) : (
          <Button
            className="mr-6 converter-btns"
            type="primary"
            shape="circle"
            size="large"
            onClick={() => {
              togglePlayed();
              setIsPageActive(true);
              setTimeout(() => {
                startHolisticModel();
              }, 2000);
            }}
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
