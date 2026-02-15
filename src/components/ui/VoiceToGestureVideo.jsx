import React from "react";
import { Modal, Button, Tooltip } from "antd";
import { SoundFilled } from "@ant-design/icons";
import { MdFullscreenExit } from "react-icons/md";
import { useSelector } from "react-redux";

function VoiceToGestureVideo(props) {
  const { modelId } = useSelector((state) => state.model);

  const {
    fullScreen,
    setFullScreen,
    toggleFullScreen,
    transcript,
    buttonSize,
    buttonStyle,
    iconSize,
    videoRef,
    startListening,
    stopListening,
    isListening,
    showMessage,
  } = props;

  return (
    <>
      {fullScreen ? (
        <Modal
          title="Voice to Gesture - Full Screen"
          centered
          open={fullScreen}
          onOk={() => setFullScreen(false)}
          onCancel={() => setFullScreen(false)}
          footer={null}
          width={props.md ? "100%" : "75%"}
          aria-labelledby="fullscreen-modal-title"
          aria-describedby="fullscreen-modal-description"
        >
          <div id="fullscreen-modal-description" className="sr-only">
            Full screen view for gesture video display. Use controls below to interact.
          </div>
          <video
            ref={videoRef}
            height="200px"
            className="block w-100p mb-6 bg-black"
            style={{ borderRadius: 'var(--radius-md)' }}
            autoPlay
            playsInline
            muted
            controls
            aria-label="Gesture animation video in full screen"
          ></video>

          <div 
            className="flex align-items-center" 
            style={{ flexWrap: "wrap", gap: 'var(--spacing-sm)' }}
            role="toolbar"
            aria-label="Full screen controls"
          >
            {isListening ? (
              <Button
                style={buttonStyle}
                className="mr-10 converter-btns"
                type="primary"
                shape="round"
                size={buttonSize}
                danger
                onClick={stopListening}
                icon={<SoundFilled size={iconSize} aria-hidden="true" />}
                aria-label="Stop listening"
              >
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                style={buttonStyle}
                className="mr-10 converter-btns"
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
                aria-label="Start listening"
              >
                <span>Speak</span>
              </Button>
            )}

            <Tooltip title="Exit full screen" showArrow={true} placement="bottom">
              <Button
                style={buttonStyle}
                type="primary"
                className="converter-btns"
                danger
                shape="circle"
                size={buttonSize}
                onClick={toggleFullScreen}
                icon={<MdFullscreenExit size={iconSize} aria-hidden="true" />}
                aria-label="Exit full screen mode"
              />
            </Tooltip>
          </div>

          {transcript && (
            <div 
              className="pt-4"
              role="region"
              aria-live="polite"
              aria-label="Speech transcript"
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-neutral-50)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--spacing-md)'
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                <strong>Transcript:</strong> {transcript}
              </p>
            </div>
          )}
        </Modal>
      ) : (
         <div 
           className="converter-video-placeholder block w-100p mb-4 bg-black" 
           style={{ 
             position: 'relative', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center', 
             minHeight: '725px',
             borderRadius: 'var(--radius-md)',
             overflow: 'hidden',
             marginTop: 'var(--spacing-xs)'
           }}
          role="img"
          aria-label={isListening ? "Gesture video display - currently processing" : "Gesture video display - ready to start"}
        >
          <video
            ref={videoRef}
            className="w-100p h-100p"
            style={{ position: 'absolute', top: 0, left: 0 }}
            aria-label="Gesture animation video"
            playsInline
          ></video>
          {!isListening && (
            <div 
              style={{ 
                position: 'relative', 
                zIndex: 1, 
                textAlign: 'center', 
                color: '#fff', 
                opacity: 0.9,
                padding: 'var(--spacing-lg)'
              }}
              role="status"
              aria-live="polite"
            >
              <SoundFilled 
                style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)', display: 'block' }} 
                aria-hidden="true"
              />
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                Click "Speak" to start
              </p>
              <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Speak into your microphone to see gesture translation
              </p>
            </div>
          )}
          {isListening && (
            <div 
              style={{ 
                position: 'absolute', 
                top: 'var(--spacing-sm)', 
                left: 'var(--spacing-sm)', 
                zIndex: 2,
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                backgroundColor: 'rgba(255, 77, 79, 0.9)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              Processing...
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default VoiceToGestureVideo;
