import React, { useState, useEffect } from "react";
import { Button, Col, Input, Progress } from "antd";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { MdPause, MdPlayArrow } from "react-icons/md";
import useTrainModel from "../hooks/useTrainModel";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentProgress,
  setIsTrainingComplete,
  setTrainingStatus,
} from "../app/features/trainerSlice";
import useMessageApi from "../hooks/useMessageApi";

const { TextArea } = Input;

function ModelTrainer(props) {
  const [isTraining, setIsTraining] = useState(false);
  const [totalProgress, setTotalProgress] = useState();
  const { train, getTotalNumberOfLogMessages } = useTrainModel();
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  const { trainingStatus } = useSelector((state) => state.trainer);
  const { currentProgress } = useSelector((state) => state.trainer);
  const { isTrainingComplete } = useSelector((state) => state.trainer);
  const { showProgress } = useSelector((state) => state.trainer);
  const { testAccuracy } = useSelector((state) => state.trainer);
  const { validationAccuracy } = useSelector((state) => state.trainer);
  const { modelId } = useSelector((state) => state.model);

  const trainingTextArea = document.getElementById("trainingTextArea");
  useEffect(() => {
    getTotalNumberOfLogMessages()
      .then((res) => {
        setTotalProgress(res);
      })
      .catch((err) => console.log(err));
    if (trainingTextArea) {
      trainingTextArea.scrollTop = trainingTextArea.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (trainingTextArea) {
      trainingTextArea.scrollTop = trainingTextArea?.scrollHeight;
    }
  }, [currentProgress]);

  useEffect(() => {}, [isTraining]);

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
      dispatch(setTrainingStatus(false));
      dispatch(setCurrentProgress(0));
    }
  }

  return (
    <>
      {contextHolder}
      <div className="mh-100vh mb-6" style={modelTrainerStyle}>
        <Col span={8} xs={24} md={8}>
          <ModelsDropdown from="trainer" />
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
                    if (modelId == null) {
                      showMessage("info", "Please select a model");
                    } else {
                      toggleTraining();
                      train();
                    }
                  }}
                  icon={<MdPlayArrow size={24} />}
                ></Button>
              )}
            </div>

            {showProgress && (
              <Progress
                className="mt-5"
                percent={
                  isTrainingComplete
                    ? 100
                    : Math.ceil((currentProgress / totalProgress) * 100)
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
            <div className="mt-3">
              <h4>{testAccuracy}</h4>
              <h4>{validationAccuracy}</h4>
            </div>
          </div>
        </Col>
      </div>
    </>
  );
}

export default ModelTrainer;
