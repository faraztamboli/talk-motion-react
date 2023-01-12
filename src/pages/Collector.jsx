import React, { useState } from "react";
import { Col, Row, Input, Button } from "antd";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { useDispatch } from "react-redux";
import Webcam from "react-webcam";
import { useConcept } from "../app/features/modelSlice";
import useHolisticModel1 from "../hooks/useHolisticModel1";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";

function Collector(props) {
  const [isPageActive, setIsPageActive] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [collectionText, setCollectionText] = React.useState("");
  const {
    webcamRef,
    canvasRef,
    spinner,
    spinnerParentDiv,
    startHolisticModel,
    contextHolder,
  } = useHolisticModel1();

  const dispatch = useDispatch();

  const handleCollectionTextChange = () => (e) => {
    setCollectionText(e.target.value);
    dispatch(useConcept(e.target.value));
  };

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  const collectorStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  return (
    <>
      {contextHolder}
      <div style={collectorStyle} className="mh-100vh mb-6">
        <Col span={8} xs={24} md={8}>
          <ModelsDropdown />
        </Col>

        <Row>
          <Col span={16} className="pr-6">
            <div className="bg-white mt-6 converter-cards p-8">
              <h2 className="mb-0">Collect Gestures</h2>
              <p>Collect gestures and train your model</p>

              <Input
                className="mb-3"
                placeholder="Enter Collection Text"
                style={{ backgroundColor: "#E6ECF0" }}
                value={collectionText}
                onChange={handleCollectionTextChange()}
              />
              {isPageActive ? (
                <>
                  <Webcam className="input_video" hidden ref={webcamRef} />
                  <canvas
                    ref={canvasRef}
                    style={{ backgroundColor: "black" }}
                    className="output_canvas block w-100p mb-6"
                  ></canvas>
                  <div
                    ref={spinnerParentDiv}
                    className="flex flex-center-center"
                  >
                    <div
                      ref={spinner}
                      className="loading output_canvas w-100p mb-6"
                    >
                      <div className="spinner"></div>
                    </div>
                  </div>
                </>
              ) : (
                <canvas
                  style={{ backgroundColor: "black" }}
                  className="output_canvas block w-100p mb-6"
                ></canvas>
              )}
              <div className="flex flex-center-center">
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
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Collector;
