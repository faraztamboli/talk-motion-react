import React from "react";
import { Modal, Button, Tooltip } from "antd";
import { MdPause, MdPlayArrow, MdFullscreenExit } from "react-icons/md";

export const GestureCanvs = (props) => {
  const {
    fullScreen,
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
          footer={null}
          width={props.md ? "100%" : "75%"}
        >
          <canvas
            style={{ backgroundColor: "black" }}
            className="block w-100p mb-6"
          ></canvas>
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
      <canvas
        style={{ backgroundColor: "black" }}
        className="block w-100p mb-6"
      ></canvas>
    </>
  );
};
