import React, { useState, useEffect } from "react";
import { Badge, Button, Col, Input, Progress } from "antd";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { MdPause, MdPlayArrow } from "react-icons/md";
import useTrainModel from "../hooks/useTrainModel";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentProgress,
  setIsTrainingComplete,
  setTrainingStatus,
} from "../app/features/trainerSlice";

const { TextArea } = Input;

function ModelTrainer(props) {
  const [isTraining, setIsTraining] = useState(false);
  const [totalProgress, setTotalProgress] = useState();
  const { train, getTotalNumberOfLogMessages } = useTrainModel();

  const dispatch = useDispatch();

  const { trainingStatus } = useSelector((state) => state.trainer);
  const { currentProgress } = useSelector((state) => state.trainer);
  const { isTrainingComplete } = useSelector((state) => state.trainer);
  const { showProgress } = useSelector((state) => state.trainer);
  const { testAccuracy } = useSelector((state) => state.trainer);
  const { validationAccuracy } = useSelector((state) => state.trainer);

  const trainingTextArea = document.getElementById("trainingTextArea");
  useEffect(() => {
    if (trainingTextArea) {
      trainingTextArea.scrollTop = trainingTextArea.scrollHeight;
    }
    getTotalNumberOfLogMessages()
      .then((res) => {
        console.log(res);
        setTotalProgress(res);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (trainingTextArea) {
      trainingTextArea.scrollTop = trainingTextArea?.scrollHeight;
    }
  }, [currentProgress]);

  useEffect(() => {
    if (isTrainingComplete) {
      setIsTraining(false);
    }
  }, [isTrainingComplete]);

  const modelTrainerStyle = props.sm
    ? { padding: "15px" }
    : { padding: "24px" };

  function toggleTraining() {
    if (isTraining === false) {
      dispatch(setCurrentProgress(0));
      dispatch(setTrainingStatus(""));
      dispatch(setIsTrainingComplete(false));
      setIsTraining(true);
    } else {
      setIsTraining(false);
    }
  }

  return (
    <>
      <div className="mh-100vh mb-6" style={modelTrainerStyle}>
        <Col span={8} xs={24} md={8}>
          <ModelsDropdown from="trainer" />
        </Col>

        <Col span={16}>
          <Badge.Ribbon text={testAccuracy} placement="start">
            <Badge.Ribbon text={validationAccuracy} placement="end">
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

                {showProgress && (
                  <Progress
                    className="mt-5"
                    percent={
                      Math.ceil((currentProgress / totalProgress) * 100) + 5
                    }
                    status={isTrainingComplete ? "success" : "active"}
                  />
                )}

                <div className="mt-6 trainer-status">
                  <h3>Training Status</h3>
                  <TextArea
                    id="trainingTextArea"
                    rows={6}
                    placeholder="status text here"
                    style={{ backgroundColor: "#E6ECF0" }}
                    value={trainingStatus}
                  />
                </div>
              </div>
            </Badge.Ribbon>
          </Badge.Ribbon>
        </Col>
      </div>
    </>
  );
}

export default ModelTrainer;
