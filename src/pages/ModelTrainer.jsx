import React, { useState, useEffect } from "react";
import { Button, Col, Row, Input, Progress, Typography } from "antd";
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
const { Text } = Typography;

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
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <ModelsDropdown from="trainer" />
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <div 
              className="bg-white converter-cards"
              style={{
                padding: "var(--spacing-xl)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ marginBottom: "var(--spacing-xl)" }}>
                <h2 className="mb-2" style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>
                  Train Model
                </h2>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)", margin: 0 }}>
                  Train your gesture recognition model using the collected data. The training process will improve the model's accuracy.
                </p>
              </div>

              <div className="flex flex-center-center" style={{ marginBottom: "var(--spacing-xl)", gap: "var(--spacing-md)" }}>
                {isTraining ? (
                  <Button
                    type="primary"
                    danger
                    size="large"
                    onClick={toggleTraining}
                    icon={<MdPause size={24} aria-hidden="true" />}
                    style={{ 
                      minWidth: "180px",
                      height: "56px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--font-size-base)"
                    }}
                    aria-label="Pause model training"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTraining();
                      }
                    }}
                  >
                    Pause Training
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      if (modelId == null) {
                        showMessage("info", "Please select a model");
                      } else {
                        toggleTraining();
                        train();
                      }
                    }}
                    icon={<MdPlayArrow size={24} aria-hidden="true" />}
                    style={{ 
                      minWidth: "180px",
                      height: "56px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--font-size-base)"
                    }}
                    aria-label="Start model training"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (modelId == null) {
                          showMessage("info", "Please select a model");
                        } else {
                          toggleTraining();
                          train();
                        }
                      }
                    }}
                  >
                    Start Training
                  </Button>
                )}
              </div>

              {showProgress && (
                <div style={{ marginBottom: "var(--spacing-xl)" }}>
                  <div style={{ marginBottom: "var(--spacing-xs)" }}>
                    <Text strong>Training Progress</Text>
                  </div>
                  <Progress
                    percent={
                      isTrainingComplete
                        ? 100
                        : Math.ceil((currentProgress / totalProgress) * 100)
                    }
                    status={isTrainingComplete ? "success" : "active"}
                    strokeColor={isTrainingComplete ? undefined : {
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    style={{ marginBottom: "var(--spacing-xs)" }}
                  />
                  <Text type="secondary" style={{ fontSize: "var(--font-size-sm)" }}>
                    {isTrainingComplete 
                      ? "Training completed successfully!" 
                      : `Processing: ${currentProgress} of ${totalProgress} steps`}
                  </Text>
                </div>
              )}

              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <h3 style={{ marginBottom: "var(--spacing-md)", fontSize: "var(--font-size-lg)" }}>
                  Training Status
                </h3>
                <TextArea
                  id="trainingTextArea"
                  rows={8}
                  placeholder="Training status and logs will appear here..."
                  style={{ 
                    backgroundColor: "var(--color-neutral-100)",
                    fontFamily: "monospace",
                    fontSize: "var(--font-size-sm)"
                  }}
                  value={trainingStatus}
                  readOnly
                  aria-label="Training status log"
                />
              </div>
              
              {(testAccuracy || validationAccuracy) && (
                <div style={{ 
                  padding: "var(--spacing-md)",
                  backgroundColor: "var(--color-neutral-50)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-neutral-200)"
                }}>
                  <h4 style={{ margin: 0, marginBottom: "var(--spacing-xs)", fontSize: "var(--font-size-base)" }}>
                    Model Accuracy
                  </h4>
                  {testAccuracy && (
                    <Text style={{ display: "block", marginBottom: "var(--spacing-xs)" }}>
                      <strong>Test Accuracy:</strong> {testAccuracy}
                    </Text>
                  )}
                  {validationAccuracy && (
                    <Text style={{ display: "block" }}>
                      <strong>Validation Accuracy:</strong> {validationAccuracy}
                    </Text>
                  )}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default ModelTrainer;
