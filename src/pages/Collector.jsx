import React, { useState } from "react";
import { Col, Row, Input, Button } from "antd";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";
import { useConcept } from "../app/features/modelSlice";
import useHolisticModel from "../hooks/useHolisticModel";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { setIsModelLoading } from "../app/features/converterSlice";

function Collector(props) {
  const [isPageActive, setIsPageActive] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [collectionText, setCollectionText] = React.useState("");
  const { webcamRef, canvasRef, startHolisticModel, contextHolder } =
    useHolisticModel();

  const dispatch = useDispatch();

  const { isModelLoading } = useSelector((state) => state.converter);

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
          <ModelsDropdown from="trainer" />
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
                ) : (
                  <Button
                    className="mr-6 converter-btns"
                    type="primary"
                    shape="circle"
                    size="large"
                    onClick={() => {
                      togglePlayed();
                      setIsPageActive(true);
                      dispatch(setIsModelLoading(true));
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
