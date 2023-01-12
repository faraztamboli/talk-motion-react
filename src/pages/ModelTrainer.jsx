import React, { useState } from "react";
import { Button, Col, Input } from "antd";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { MdPause, MdPlayArrow } from "react-icons/md";
import useTrainModel from "../hooks/useTrainModel";
import { useSelector } from "react-redux";

const { TextArea } = Input;

function ModelTrainer(props) {
  const [isTraining, setIsTraining] = useState(false);
  const { train } = useTrainModel();

  const { trainingStatus } = useSelector((state) => state.trainer);

  const modelTrainerStyle = props.sm
    ? { padding: "15px" }
    : { padding: "24px" };

  function toggleTraining() {
    setIsTraining(!isTraining);
  }

  return (
    <div className="mh-100vh mb-6" style={modelTrainerStyle}>
      <Col span={8} xs={24} md={8}>
        <ModelsDropdown />
      </Col>

      <Col span={16}>
        <div className="bg-white mt-6 converter-cards p-8">
          <h2 className="mb-0">Train Model</h2>
          <p>Select a model and train it</p>

          <div className="flex flex-center-center">
            {isTraining ? (
              <Button
                type="primary"
                size="large"
                shape="circle"
                onClick={toggleTraining}
                style={{ backgroundColor: "#DDBA00" }}
                icon={<MdPause size={24} />}
              ></Button>
            ) : (
              <Button
                type="primary"
                size="large"
                shape="circle"
                onClick={() => {
                  toggleTraining();
                  train();
                }}
                icon={<MdPlayArrow size={24} />}
              ></Button>
            )}
          </div>

          <div className="mt-6 trainer-status">
            <h3>Training Status</h3>
            <TextArea
              rows={6}
              placeholder="status text here"
              style={{ backgroundColor: "#E6ECF0" }}
              value={trainingStatus}
            />
          </div>
        </div>
      </Col>
    </div>
  );
}

export default ModelTrainer;
