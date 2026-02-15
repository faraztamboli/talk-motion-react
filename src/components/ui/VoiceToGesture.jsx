import React from "react";
import { Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdFullscreen } from "react-icons/md";
import VoiceToGestureVideo from "./VoiceToGestureVideo";
import useVoiceToGesture from "../../hooks/useVoiceToGesture";
import { useSelector } from "react-redux";
import useMessageApi from "../../hooks/useMessageApi";

export const VoiceToGesture = (props) => {
  const [fullScreen, setFullScreen] = React.useState(false);

  const { startListening, stopListening, isListening, videoRef, transcript } =
    useVoiceToGesture();
  const { contextHolder, showMessage } = useMessageApi();

  const { modelId } = useSelector((state) => state.model);

  const buttonSize = props.md ? "medium" : "large";
  const iconSize = props.md ? 20 : 24;
  const buttonStyle = props.md ? { marginBottom: "1rem" } : null;

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  return (
    <>
      {contextHolder}
      <div style={{ position: "relative" }} className="converter-card-content" role="region" aria-labelledby="voice-to-gesture-title">
        <div style={{ marginBottom: 'var(--spacing-xs)' }}>
          <h2 
            id="voice-to-gesture-title"
            className="mb-0" 
            style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            Voice To Gesture
          </h2>
          <p style={{ margin: '2px 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            View gestures from speech
          </p>
        </div>
        <VoiceToGestureVideo
          transcript={transcript}
          videoRef={videoRef}
          startListening={startListening}
          stopListening={stopListening}
          showMessage={showMessage}
          isListening={isListening}
          fullScreen={fullScreen}
          setFullScreen={setFullScreen}
          toggleFullScreen={toggleFullScreen}
          buttonSize={buttonSize}
          buttonStyle={buttonStyle}
          iconSize={iconSize}
          md={props.md}
          sm={props.sm}
        />
        {fullScreen !== true && (
          <>
            <div
              className="flex flex-center-center"
              style={{ flexWrap: "wrap", marginTop: 'var(--spacing-sm)', gap: 'var(--spacing-sm)' }}
              role="toolbar"
              aria-label="Voice to Gesture controls"
            >
              {isListening ? (
                <>
                  <div 
                    role="status" 
                    aria-live="polite" 
                    aria-atomic="true"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)', 
                      marginRight: 'var(--spacing-sm)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      backgroundColor: 'var(--color-error-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-error)'
                    }}
                  >
                    <div 
                      role="img"
                      aria-label="Listening indicator"
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--color-error)', 
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }}
                    ></div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-error)', fontWeight: 600 }}>
                      Listening...
                    </span>
                  </div>
                  <Button
                    style={buttonStyle}
                    className="converter-btns"
                    type="primary"
                    shape="round"
                    size={buttonSize}
                    danger
                    onClick={stopListening}
                    icon={<SoundFilled size={iconSize} aria-hidden="true" />}
                    aria-label="Stop listening and processing"
                    aria-pressed={isListening}
                  >
                    <span>Stop</span>
                  </Button>
                </>
              ) : (
                <Button
                  style={buttonStyle}
                  className="converter-btns"
                  type="primary"
                  shape="round"
                  size={buttonSize}
                  onClick={() => {
                    if (modelId) {
                      startListening();
                    } else {
                      showMessage("info", "Please select a model first");
                    }
                  }}
                  icon={<SoundFilled size={iconSize} aria-hidden="true" />}
                  aria-label="Start listening to convert voice to gesture"
                  aria-pressed={false}
                >
                  <span>Speak</span>
                </Button>
              )}

              <Tooltip title="View in full screen mode" showArrow={true} placement="bottom">
                <Button
                  style={buttonStyle}
                  type="default"
                  className="converter-btns"
                  shape="circle"
                  size={buttonSize}
                  onClick={toggleFullScreen}
                  icon={<MdFullscreen size={iconSize} aria-hidden="true" />}
                  aria-label="Open in full screen"
                />
              </Tooltip>
            </div>

            {transcript && (
              <div 
                role="region"
                aria-live="polite"
                aria-label="Speech transcript"
                style={{ 
                  marginTop: 'var(--spacing-md)', 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  backgroundColor: 'var(--color-neutral-50)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-200)'
                }}
              >
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Transcript:</strong>{' '}
                  <span style={{ color: 'var(--color-text-secondary)' }}>{transcript}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
