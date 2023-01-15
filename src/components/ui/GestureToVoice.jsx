import React, { useEffect } from "react";
import { Button, Slider, Tooltip } from "antd";
import {
  MdPause,
  MdPlayArrow,
  MdFullscreen,
  MdVolumeUp,
  MdVolumeMute,
} from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useHolisticModel1 from "../../hooks/useHolisticModel1";
import { useDispatch, useSelector } from "react-redux";
import { setVolume } from "../../app/features/speechSlice";
import useSpeechSynthesis from "../../hooks/useSpeechSynthesis";

export const GestureToVoice = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const [isPageActive, setIsPageActive] = React.useState(false);
  const [isPlayed, setIsPlayed] = React.useState(false);
  const [mute, setMute] = React.useState(false);

  const { speak } = useSpeechSynthesis();

  const { volume } = useSelector((state) => state.speech);
  const { isSpeaking } = useSelector((state) => state.speech);
  const { speakText } = useSelector((state) => state.speech);
  const { isRecording } = useSelector((state) => state.converter);

  const dispatch = useDispatch();

  // const speechsynthesis = window.speechSynthesis;
  // console.log(speechsynthesis.getVoices());

  const {
    webcamRef,
    canvasRef,
    spinner,
    spinnerParentDiv,
    startHolisticModel,
  } = useHolisticModel1();

  useEffect(() => {
    speak(speakText, volume);
  }, [isSpeaking]);

  useEffect(() => {
    if (mute) {
      dispatch(setVolume(0));
    } else {
      dispatch(setVolume(0.5));
    }
  }, [mute]);

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const toggleMute = () => {
    setMute(!mute);
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
      <div className="flex flex-between-center">
        <p>generate speech from gestures</p>
        {isPlayed && (
          <div
            className={isRecording ? "bg-danger" : "bg-success"}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
            }}
          ></div>
        )}
      </div>
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
      {isPlayed && (
        <Slider
          disabled={mute}
          defaultValue={10}
          max={20}
          onChange={onVolumeChange}
        />
      )}
      {isPlayed && (
        <div className="flex flex-center-center mb-3">
          {!mute ? (
            <Button
              icon={<MdVolumeUp size={24} color="#1677ff" />}
              onClick={toggleMute}
            />
          ) : (
            <Button
              icon={<MdVolumeMute size={24} color="#1677ff" />}
              onClick={toggleMute}
            />
          )}
        </div>
      )}
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
      {props.from === "converter" && <p>{speakText}</p>}
    </div>
  );
};
