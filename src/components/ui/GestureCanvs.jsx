import React, { useEffect } from "react";
import Webcam from "react-webcam";
import { Modal, Button, Tooltip } from "antd";
import { MdPause, MdPlayArrow, MdFullscreenExit } from "react-icons/md";

export const GestureCanvs = (props) => {
  const {
    fullScreen,
    webcamRef,
    canvasRef,
    spinner,
    spinnerParentDiv,
    setFullScreen,
    toggleFullScreen,
    isPlayed,
    togglePause,
    iconSize,
    buttonSize,
    buttonStyle,
    isPageActive,
    setIsPageActive,
  } = props;

  useEffect(() => {
    return () => {
      setIsPageActive(false); // to destroy the webcam when the component unmounts
      console.log("cleaned");
    };
  }, []);

  console.log(isPlayed);

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
            {isPlayed ? (
              <Button
                className="mr-6 converter-btns"
                type="primary"
                shape="circle"
                size="large"
                onClick={() => togglePause()}
                icon={<MdPlayArrow size={24} />}
              ></Button>
            ) : (
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
      {isPageActive ? (
        <>
          <Webcam hidden ref={webcamRef} />
          <canvas
            ref={canvasRef}
            style={{ backgroundColor: "black" }}
            className="output_canvas block w-100p mb-6"
          ></canvas>
          <div ref={spinnerParentDiv}>
            <div ref={spinner} className="loading">
              <div className="spinner"></div>
              <div className="message">Loading</div>
            </div>
          </div>
        </>
      ) : (
        <canvas
          style={{ backgroundColor: "black" }}
          className="output_canvas block w-100p mb-6"
        ></canvas>
      )}
    </>
  );
};
