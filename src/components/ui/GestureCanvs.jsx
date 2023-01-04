import React from "react";
import { Modal, Button, Tooltip } from "antd";
import { MdPause, MdPlayArrow, MdFullscreenExit } from "react-icons/md";
import { useEffect } from "react";
import Webcam from "react-webcam";

export const GestureCanvs = (props) => {
  useEffect(() => {
    return () => {
      console.log("cleaned");
    };
  });
  const {
    fullScreen,
    webcamRef,
    canvasRef,
    spinner,
    spinnerParentDiv,
    // videoElement,
    // canvasElement,
    // controlsElement,
    setFullScreen,
    toggleFullScreen,
    isPaused,
    togglePause,
    iconSize,
    buttonSize,
    buttonStyle,
  } = props;
  return (
    <>
      {fullScreen && (
        <Modal
          title="Gesture to Voice"
          centered
          open={fullScreen}
          onOk={() => setFullScreen(false)}
          onCancel={() => setFullScreen(false)}
          destroyOnClose={true}
          footer={null}
          width={props.md ? "100%" : "75%"}
        >
          <Webcam hidden ref={webcamRef} />
          <canvas
            ref={canvasRef}
            style={{ backgroundColor: "black" }}
            className="block w-100p mb-6"
          ></canvas>
          <div ref={spinnerParentDiv}>
            <div ref={spinner} className="loading">
              <div className="spinner"></div>
              <div className="message">Loading</div>
            </div>
          </div>
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
            <Tooltip
              title="Exit Full Screen"
              showArrow={false}
              placement="bottom"
            >
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
        </Modal>
      )}
      <Webcam hidden ref={webcamRef} />
      <canvas
        ref={canvasRef}
        style={{ backgroundColor: "black" }}
        className="output-canvas block w-100p mb-6"
      ></canvas>
      <div ref={spinnerParentDiv}>
        <div ref={spinner} className="loading">
          <div className="spinner"></div>
          <div className="message">Loading</div>
        </div>
      </div>
    </>
  );
};
