import React, { useState, useEffect } from "react";
import { Col, Row, Input, Button, Typography } from "antd";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";
import { useConcept } from "../app/features/modelSlice";
import useHolisticModel from "../hooks/useHolisticModel";
import { ModelsDropdown } from "../components/ui/ModelsDropdown";
import { setIsModelLoading } from "../app/features/converterSlice";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const { Text } = Typography;

function Collector(props) {
  const [isPageActive, setIsPageActive] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);
  const [collectionText, setCollectionText] = React.useState("");
  const { startListening, stopListening, isListening, transcript } =
    useSpeechRecognition();
  const {
    webcamRef,
    canvasRef,
    startHolisticModel,
    contextHolder,
    showMessage,
  } = useHolisticModel();

  const dispatch = useDispatch();

  const { isModelLoading } = useSelector((state) => state.converter);
  const { modelId } = useSelector((state) => state.model);
  const { concept } = useSelector((state) => state.model);

  const handleCollectionTextChange = () => (e) => {
    console.log(e.target.value);
    setCollectionText(e.target.value);
    dispatch(useConcept(e.target.value));
    console.log("concept", concept);
  };

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  useEffect(() => {
    setCollectionText(transcript);
    dispatch(useConcept(transcript));
  }, [transcript]);

  const collectorStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
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
                  Collect gesture samples by entering text and recording your signs. This helps train your model to recognize different gestures.
                </p>
              </div>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label 
                  htmlFor="collector-concept-input"
                  style={{ 
                    display: "block", 
                    marginBottom: "var(--spacing-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text)"
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
                      fontSize: "var(--font-size-base)"
                    }}
                    value={collectionText}
                    onChange={handleCollectionTextChange()}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          stopListening();
                        }
                      }}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          startListening();
                        }
                      }}
                    >
                      Voice Input
                    </Button>
                  )}
                </Input.Group>
                <Text type="secondary" style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--spacing-xs)", display: "block" }}>
                  Type the text or use voice input to enter the gesture you want to collect
                </Text>
              </div>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "var(--spacing-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text)"
                  }}
                >
                  Camera Preview
                </label>
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
                  {isPageActive ? (
                    <>
                      <Webcam className="input_video" hidden ref={webcamRef} />
                      <canvas
                        ref={canvasRef}
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          maxHeight: "600px",
                          objectFit: "contain"
                        }}
                        className="output_canvas block w-100p"
                        aria-label="Camera preview with gesture recognition overlay"
                      ></canvas>
                    </>
                  ) : (
                    <div style={{ 
                      color: "#fff", 
                      textAlign: "center",
                      padding: "var(--spacing-xl)"
                    }}>
                      <p style={{ fontSize: "var(--font-size-lg)", margin: 0 }}>
                        Camera preview will appear here
                      </p>
                      <p style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--spacing-xs)", opacity: 0.7 }}>
                        Click the start button below to begin recording
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-center-center" style={{ gap: "var(--spacing-md)" }}>
                {isPlayed ? (
                  <Button
                    loading={isModelLoading}
                    type="primary"
                    danger
                    size="large"
                    icon={<MdPause size={24} aria-hidden="true" />}
                    onClick={() => {
                      togglePlayed();
                      setIsPageActive(false);
                    }}
                    style={{ 
                      minWidth: "160px",
                      height: "48px",
                      borderRadius: "var(--radius-md)"
                    }}
                    aria-label="Pause gesture collection"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        togglePlayed();
                        setIsPageActive(false);
                      }
                    }}
                  >
                    Pause Collection
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={<MdPlayArrow size={24} aria-hidden="true" />}
                    onClick={() => {
                      console.log(modelId, concept);
                      if (modelId && concept !== null && concept !== "") {
                        togglePlayed();
                        setIsPageActive(true);
                        dispatch(setIsModelLoading(true));
                        setTimeout(() => {
                          startHolisticModel();
                        }, 2000);
                      } else {
                        showMessage(
                          "info",
                          "Please select a model and enter collection text"
                        );
                      }
                    }}
                    style={{ 
                      minWidth: "160px",
                      height: "48px",
                      borderRadius: "var(--radius-md)"
                    }}
                    aria-label="Start gesture collection"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (modelId && concept !== null && concept !== "") {
                          togglePlayed();
                          setIsPageActive(true);
                          dispatch(setIsModelLoading(true));
                          setTimeout(() => {
                            startHolisticModel();
                          }, 2000);
                        } else {
                          showMessage(
                            "info",
                            "Please select a model and enter collection text"
                          );
                        }
                      }
                    }}
                  >
                    Start Collection
                  </Button>
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
