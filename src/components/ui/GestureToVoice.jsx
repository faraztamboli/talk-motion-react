import React from "react";
import { Button } from "antd";
import { FaRegPauseCircle, FaRegPlayCircle } from "react-icons/fa";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";

export const GestureToVoice = (props) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const loadings = () => {};
  const speak = () => {
    setIsRecording(!isRecording);
  };
  const stopSpeak = () => {
    setIsRecording(!isRecording);
  };
  return (
    <div>
      <h2 className="mb-0">Gesture to Voice</h2>
      <p>generate speech from gestures</p>
      <GestureCanvs />
      {props.from === "converter" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isRecording ? (
            <Button
              className="converter-btns"
              type="primary"
              shape="circle"
              style={{ backgroundColor: "#DDBA00" }}
              size="large"
              danger
              loading={loadings[0]}
              onClick={() => stopSpeak(0)}
              icon={<MdPause size={24} />}
            ></Button>
          ) : (
            <Button
              className="converter-btns"
              type="primary"
              shape="circle"
              size="large"
              loading={loadings[1]}
              onClick={() => speak(1)}
              icon={<MdPlayArrow size={24} />}
            ></Button>
          )}
        </div>
      )}
      {props.from === "converter" && (
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sunt a quod
          nam, dolorem atque
        </p>
      )}
    </div>
  );
};
