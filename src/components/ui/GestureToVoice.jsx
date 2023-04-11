import React, { useEffect } from "react";
import { Button, Slider } from "antd";
import { MdPause, MdPlayArrow, MdVolumeUp, MdVolumeMute } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useHolisticModel from "../../hooks/useHolisticModel";
import { useDispatch, useSelector } from "react-redux";
import { setVolume } from "../../app/features/speechSlice";
import useSpeechSynthesis from "../../hooks/useSpeechSynthesis";
import { setIsModelLoading } from "../../app/features/converterSlice";
import useMessageApi from "../../hooks/useMessageApi";

export const GestureToVoice = (props) => {
  const [isPageActive, setIsPageActive] = React.useState(false);
  const [isPlayed, setIsPlayed] = React.useState(false);
  const [mute, setMute] = React.useState(false);
  const { contextHolder, showMessage } = useMessageApi();

  const { speak } = useSpeechSynthesis();

  const { modelId } = useSelector((state) => state.model);
  const { volume } = useSelector((state) => state.speech);
  const { isSpeaking } = useSelector((state) => state.speech);
  const { speakText } = useSelector((state) => state.speech);
  const { isRecording } = useSelector((state) => state.converter);
  const { isModelLoading } = useSelector((state) => state.converter);

  const dispatch = useDispatch();

  const { webcamRef, canvasRef, startHolisticModel } = useHolisticModel();

  useEffect(() => {
    if (isSpeaking) {
      if (speakText !== undefined) {
        speak(speakText, volume);
      }
    }
  }, [speakText]);

  useEffect(() => {
    console.log('setVolume');
    if (mute) {
      dispatch(setVolume(0));
    } else {
      dispatch(setVolume(0.5));
    }
  }, [mute]);

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  const toggleMute = () => {
    setMute(!mute);
  };

  const onVolumeChange = (value) => {
    value = (value / 20) * 1;
    console.log(value);
    dispatch(setVolume(value));
  };

  return (
    <>
      {contextHolder}
      <div>
        <h2 className="mb-0">Gesture to Voice</h2>
        <div className="flex flex-between-center">
          <p>Generate speech from gestures</p>
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
          webcamRef={webcamRef}
          canvasRef={canvasRef}
          setIsPlayed={setIsPlayed}
          isPageActive={isPageActive}
          setIsPageActive={setIsPageActive}
        />
        {isPlayed && (
          <div className="flex flex-center-center w-100p mb-3">
            {!mute ? (
              <Button
                className="no-border"
                icon={<MdVolumeUp size={24} color="#1677ff" />}
                onClick={toggleMute}
              />
            ) : (
              <Button
                className="no-border"
                icon={<MdVolumeMute size={24} color="#1677ff" />}
                onClick={toggleMute}
              />
            )}
            <Slider
              className="w-100p"
              disabled={mute}
              defaultValue={10}
              max={20}
              onChange={onVolumeChange}
            />
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
            <>
              <Button
                loading={isModelLoading}
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
            </>
          ) : (
            <Button
              className="mr-6 converter-btns"
              type="primary"
              shape="circle"
              size="large"
              onClick={() => {
                if (modelId) {
                  togglePlayed();
                  setIsPageActive(true);
                  dispatch(setIsModelLoading(true));
                  setTimeout(() => {
                    startHolisticModel();
                  }, 2000);
                } else {
                  showMessage("info", "please select a model");
                }
              }}
              icon={<MdPlayArrow size={24} />}
            ></Button>
          )}
        </div>
        {props.from === "converter" && <p>{speakText}</p>}
      </div>
    </>
  );
};
