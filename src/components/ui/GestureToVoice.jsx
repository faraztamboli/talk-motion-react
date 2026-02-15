import React, { useEffect } from "react";
import { Button, Slider } from "antd";
import { MdPause, MdPlayArrow, MdVolumeUp, MdVolumeMute } from "react-icons/md";
import { GestureCanvs } from "./GestureCanvs";
import useHolisticModel from "../../hooks/useHolisticModel";
import { useDispatch, useSelector } from "react-redux";
import { setVolume } from "../../app/features/speechSlice";
import useSpeechSynthesis from "../../hooks/useSpeechSynthesis";
import { setIsModelLoading } from "../../app/features/converterSlice";
import useMessageApi from "../../hooks/useMessageApi";

export const GestureToVoice = (props) => {
  const [isPageActive, setIsPageActive] = React.useState(false);
  const [isPlayed, setIsPlayed] = React.useState(false);
  const [mute, setMute] = React.useState(false);
  const { contextHolder, showMessage } = useMessageApi();

  const { speak } = useSpeechSynthesis();

  const { modelId } = useSelector((state) => state.model);
  const { volume } = useSelector((state) => state.speech);
  const { isSpeaking } = useSelector((state) => state.speech);
  const { speakText } = useSelector((state) => state.speech);
  const { isRecording } = useSelector((state) => state.converter);
  const { isModelLoading } = useSelector((state) => state.converter);

  const dispatch = useDispatch();

  const { webcamRef, canvasRef, startHolisticModel, stopHolisticModel } = useHolisticModel();

  useEffect(() => {
    if (isSpeaking) {
      if (speakText !== undefined) {
        speak(speakText, volume);
      }
    }
  }, [speakText]);

  useEffect(() => {
    console.log('setVolume');
    if (mute) {
      dispatch(setVolume(0));
    } else {
      dispatch(setVolume(0.5));
    }
  }, [mute]);

  const togglePlayed = () => {
    setIsPlayed(!isPlayed);
  };

  const toggleMute = () => {
    setMute(!mute);
  };

  const onVolumeChange = (value) => {
    value = (value / 20) * 1;
    console.log(value);
    dispatch(setVolume(value));
  };

  return (
    <>
      {contextHolder}
      <div className="converter-card-content" role="region" aria-labelledby="gesture-to-voice-title">
        <div style={{ marginBottom: 'var(--spacing-xs)' }}>
          <div className="flex flex-between-center" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 
                id="gesture-to-voice-title"
                className="mb-0" 
                style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
              >
                Gesture to Voice
              </h2>
              <p style={{ margin: '2px 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Generate speech from gestures
              </p>
            </div>
            {isPlayed && (
              <div 
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  backgroundColor: isRecording ? 'var(--color-error-light)' : 'var(--color-success-light)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isRecording ? 'var(--color-error)' : 'var(--color-success)'}`
                }}
              >
                <div
                  role="img"
                  aria-label={isRecording ? "Recording indicator" : "Ready indicator"}
                  className={isRecording ? "bg-danger" : "bg-success"}
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }}
                ></div>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: isRecording ? 'var(--color-error)' : 'var(--color-success)', 
                  fontWeight: 600 
                }}>
                  {isRecording ? 'Recording' : 'Ready'}
                </span>
              </div>
            )}
          </div>
        </div>
        <GestureCanvs
          webcamRef={webcamRef}
          canvasRef={canvasRef}
          setIsPlayed={setIsPlayed}
          isPageActive={isPageActive}
          setIsPageActive={setIsPageActive}
        />
        {isPlayed && (
          <div 
            className="flex flex-center-center w-100p mb-3"
            role="group"
            aria-label="Volume controls"
            style={{ gap: 'var(--spacing-sm)' }}
          >
            {!mute ? (
              <Button
                className="no-border"
                icon={<MdVolumeUp size={24} color="#1677ff" aria-hidden="true" />}
                onClick={toggleMute}
                aria-label="Mute volume"
                aria-pressed={false}
              />
            ) : (
              <Button
                className="no-border"
                icon={<MdVolumeMute size={24} color="#1677ff" aria-hidden="true" />}
                onClick={toggleMute}
                aria-label="Unmute volume"
                aria-pressed={true}
              />
            )}
            <Slider
              className="w-100p"
              disabled={mute}
              defaultValue={10}
              max={20}
              onChange={onVolumeChange}
              aria-label="Volume control"
              aria-valuemin={0}
              aria-valuemax={20}
              aria-valuenow={mute ? 0 : 10}
            />
            <span 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-secondary)',
                minWidth: '40px',
                textAlign: 'right'
              }}
              aria-live="polite"
            >
              {mute ? 'Muted' : `${Math.round((10 / 20) * 100)}%`}
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 'var(--spacing-sm)',
            gap: 'var(--spacing-sm)'
          }}
          role="toolbar"
          aria-label="Gesture to Voice controls"
        >
          {isPlayed ? (
            <>
              {isModelLoading && (
                <span 
                  role="status"
                  aria-live="polite"
                  style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--color-text-secondary)', 
                    marginRight: 'var(--spacing-sm)',
                    fontWeight: 500
                  }}
                >
                  Processing...
                </span>
              )}
              <Button
                loading={isModelLoading}
                className="converter-btns"
                type="primary"
                shape="round"
                style={{ backgroundColor: "#DDBA00" }}
                size="large"
                danger
                onClick={() => {
                  togglePlayed();
                  setIsPageActive(false);
                  stopHolisticModel();
                }}
                icon={<MdPause size={24} aria-hidden="true" />}
                aria-label="Pause gesture recognition"
                aria-pressed={true}
              >
                <span>Pause</span>
              </Button>
            </>
          ) : (
            <Button
              className="converter-btns"
              type="primary"
              shape="round"
              size="large"
              onClick={() => {
                if (modelId) {
                  togglePlayed();
                  setIsPageActive(true);
                  dispatch(setIsModelLoading(true));
                  setTimeout(() => {
                    startHolisticModel();
                  }, 2000);
                } else {
                  showMessage("info", "Please select a model first");
                }
              }}
              icon={<MdPlayArrow size={24} aria-hidden="true" />}
              aria-label="Start gesture recognition to convert gestures to voice"
              aria-pressed={false}
            >
              <span>Start</span>
            </Button>
          )}
        </div>
        {props.from === "converter" && speakText && (
          <div 
            role="region"
            aria-live="polite"
            aria-label="Generated speech text"
            style={{ 
              marginTop: 'var(--spacing-md)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'var(--color-neutral-50)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-neutral-200)'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
              <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Speech:</strong>{' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>{speakText}</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};
