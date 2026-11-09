import React, { useState, useEffect } from "react";
import { Col, Row, Input, Button, Typography, Progress, Tag, Alert } from "antd";
import { MdPlayArrow, MdReplay, MdCheck, MdClose, MdVideocam } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";
import { useConcept } from "../app/features/modelSlice";
import useHolisticModel from "../hooks/useHolisticModel";
import useCaptureWizard from "../hooks/useCaptureWizard";
import { SkeletonReplay } from "../components/ui/SkeletonReplay";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { setIsModelLoading } from "../app/features/converterSlice";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const { Text } = Typography;

function Collector(props) {
  const [cameraOn, setCameraOn] = useState(false);
  const [collectionText, setCollectionText] = useState("");
  const { startListening, stopListening, isListening, transcript } =
    useSpeechRecognition();

  const dispatch = useDispatch();
  const { isModelLoading } = useSelector((state) => state.converter);
  const { modelId } = useSelector((state) => state.model);
  const { concept } = useSelector((state) => state.model);
  const { sequenceLength } = useSelector((state) => state.model);

  const wizard = useCaptureWizard({
    modelId,
    concept,
    sequenceLength: sequenceLength || 30,
  });

  const {
    webcamRef,
    canvasRef,
    startHolisticModel,
    stopHolisticModel,
    contextHolder,
    showMessage,
  } = useHolisticModel({ onFrame: wizard.onFrame });

  const handleCollectionTextChange = (e) => {
    setCollectionText(e.target.value);
    dispatch(useConcept(e.target.value));
  };

  useEffect(() => {
    if (transcript) {
      setCollectionText(transcript);
      dispatch(useConcept(transcript));
    }
  }, [transcript]);

  useEffect(() => {
    return () => stopHolisticModel();
  }, []);

  const startCamera = () => {
    if (!modelId || !concept) {
      showMessage("info", "Please select a model and enter collection text");
      return;
    }
    setCameraOn(true);
    dispatch(setIsModelLoading(true));
    setTimeout(() => startHolisticModel(), 2000);
  };

  const stopCamera = () => {
    wizard.cancel();
    setCameraOn(false);
    stopHolisticModel();
  };

  const { phase } = wizard;
  const inReview = phase === "review" || phase === "submitting";
  const collectorStyle = props.sm ? { padding: "15px" } : { padding: "24px" };

  const statusLine = () => {
    switch (phase) {
      case "countdown":
        return `Get ready... recording starts in ${wizard.countdown}`;
      case "recording":
        return `Recording — keep signing "${concept}"`;
      case "review":
        return "Review your sample. Keep it or record again.";
      case "submitting":
        return "Saving sample...";
      default:
        return cameraOn
          ? "Camera ready. Press Record when you are."
          : "Turn on the camera to begin.";
    }
  };

  return (
    <>
      {contextHolder}
      <div style={collectorStyle} className="mh-100vh mb-6">
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
                  Collect Gestures
                </h2>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)", margin: 0 }}>
                  Record sign samples step by step: countdown, record, review, keep or retake.
                  Only samples you keep are used for training.
                </p>
              </div>

              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label
                  htmlFor="collector-concept-input"
                  style={{
                    display: "block",
                    marginBottom: "var(--spacing-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text)",
                  }}
                >
                  Enter Gesture Text
                </label>
                <Input.Group compact style={{ display: "flex" }}>
                  <Input
                    id="collector-concept-input"
                    placeholder="Type the word or phrase you want to sign..."
                    style={{
                      backgroundColor: "var(--color-neutral-100)",
                      flex: 1,
                      height: "48px",
                      fontSize: "var(--font-size-base)",
                    }}
                    value={collectionText}
                    onChange={handleCollectionTextChange}
                    disabled={phase !== "idle"}
                    aria-label="Enter gesture text for collection"
                  />
                  {isListening ? (
                    <Button
                      danger
                      type="primary"
                      onClick={stopListening}
                      icon={<AudioMutedOutlined aria-hidden="true" />}
                      aria-label="Stop voice input"
                      style={{ height: "48px" }}
                    >
                      Stop Voice
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      onClick={startListening}
                      icon={<AudioOutlined aria-hidden="true" />}
                      aria-label="Start voice input"
                      style={{ height: "48px" }}
                      disabled={phase !== "idle"}
                    >
                      Voice Input
                    </Button>
                  )}
                </Input.Group>
                {wizard.sampleCount !== null && (
                  <Tag color="green" style={{ marginTop: "var(--spacing-xs)" }}>
                    {wizard.sampleCount} sample{wizard.sampleCount === 1 ? "" : "s"} saved for "{concept}"
                  </Tag>
                )}
              </div>

              {wizard.error && (
                <Alert
                  type="error"
                  message={wizard.error}
                  showIcon
                  closable
                  style={{ marginBottom: "var(--spacing-md)" }}
                />
              )}

              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    marginBottom: "var(--spacing-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text)",
                  }}
                >
                  {statusLine()}
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    backgroundColor: "#000",
                    minHeight: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Live camera + landmark overlay (hidden during review) */}
                  <div style={{ width: "100%", display: cameraOn && !inReview ? "block" : "none" }}>
                    {cameraOn && <Webcam className="input_video" hidden ref={webcamRef} />}
                    <canvas
                      ref={canvasRef}
                      style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: "600px",
                        objectFit: "contain",
                      }}
                      className="output_canvas block w-100p"
                      aria-label="Camera preview with gesture recognition overlay"
                    ></canvas>
                  </div>

                  {/* Countdown overlay */}
                  {phase === "countdown" && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: "8rem",
                        fontWeight: 700,
                      }}
                    >
                      {wizard.countdown}
                    </div>
                  )}

                  {/* Review replay */}
                  {inReview && (
                    <div style={{ width: "100%" }}>
                      <SkeletonReplay frames={wizard.recordedFrames} />
                    </div>
                  )}

                  {!cameraOn && (
                    <div
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        padding: "var(--spacing-xl)",
                      }}
                    >
                      <p style={{ fontSize: "var(--font-size-lg)", margin: 0 }}>
                        Camera preview will appear here
                      </p>
                      <p style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--spacing-xs)", opacity: 0.7 }}>
                        Turn on the camera to begin
                      </p>
                    </div>
                  )}
                </div>
                {phase === "recording" && (
                  <Progress
                    percent={Math.min(
                      100,
                      Math.round((wizard.frameCount / wizard.targetFrames) * 100)
                    )}
                    status="active"
                    aria-label="Recording progress"
                    style={{ marginTop: "var(--spacing-xs)" }}
                  />
                )}
              </div>

              <div
                className="flex flex-center-center"
                style={{ gap: "var(--spacing-md)", flexWrap: "wrap" }}
                role="toolbar"
                aria-label="Capture controls"
              >
                {!cameraOn && (
                  <Button
                    type="primary"
                    size="large"
                    loading={isModelLoading}
                    icon={<MdVideocam size={24} aria-hidden="true" />}
                    onClick={startCamera}
                    style={{ minWidth: "160px", height: "48px", borderRadius: "var(--radius-md)" }}
                    aria-label="Turn on camera"
                  >
                    Turn On Camera
                  </Button>
                )}

                {cameraOn && phase === "idle" && (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      icon={<MdPlayArrow size={24} aria-hidden="true" />}
                      onClick={wizard.startCapture}
                      style={{ minWidth: "160px", height: "48px", borderRadius: "var(--radius-md)" }}
                      aria-label="Record a sample"
                    >
                      Record Sample
                    </Button>
                    <Button
                      size="large"
                      icon={<MdClose size={24} aria-hidden="true" />}
                      onClick={stopCamera}
                      style={{ height: "48px", borderRadius: "var(--radius-md)" }}
                      aria-label="Turn off camera"
                    >
                      Turn Off Camera
                    </Button>
                  </>
                )}

                {(phase === "countdown" || phase === "recording") && (
                  <Button
                    danger
                    size="large"
                    icon={<MdClose size={24} aria-hidden="true" />}
                    onClick={wizard.cancel}
                    style={{ minWidth: "160px", height: "48px", borderRadius: "var(--radius-md)" }}
                    aria-label="Cancel this recording"
                  >
                    Cancel
                  </Button>
                )}

                {inReview && (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      loading={phase === "submitting"}
                      icon={<MdCheck size={24} aria-hidden="true" />}
                      onClick={wizard.keep}
                      style={{ minWidth: "160px", height: "48px", borderRadius: "var(--radius-md)" }}
                      aria-label="Keep this sample and save it for training"
                    >
                      Keep Sample
                    </Button>
                    <Button
                      size="large"
                      disabled={phase === "submitting"}
                      icon={<MdReplay size={24} aria-hidden="true" />}
                      onClick={wizard.retake}
                      style={{ minWidth: "160px", height: "48px", borderRadius: "var(--radius-md)" }}
                      aria-label="Discard this sample and record again"
                    >
                      Retake
                    </Button>
                  </>
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
