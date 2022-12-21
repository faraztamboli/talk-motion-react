import React, { useEffect } from "react";
import { Button } from "antd";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useLeapMotion from "../../hooks/useLeapMotion";

export const GestureToVoice = (props) => {
  const [isPaused, setIsPaused] = React.useState(false);
  const { getComponentDetails } = useLeapMotion();

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    getComponentDetails(isPaused, false, props.modalId, "");
  }, [isPaused]);

  return (
    <div>
      <h2 className="mb-0">Gesture to Voice</h2>
      <p>generate speech from gestures</p>
      <GestureCanvs />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPaused ? (
          <Button
            className="converter-btns"
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
            className="converter-btns"
            type="primary"
            shape="circle"
            size="large"
            onClick={() => togglePause()}
            icon={<MdPlayArrow size={24} />}
          ></Button>
        )}
      </div>
      {props.from === "converter" && <p>Lorem ipsum dolor sit</p>}
    </div>
  );
};
