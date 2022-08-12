import React from 'react';
import { Button } from 'antd';
import { FaRegPauseCircle, FaRegPlayCircle } from 'react-icons/fa';
import { GestureCanvs } from './GestureCanvs';

export const GestureToVoice = () => {
  const [isRecording, setIsRecording] = React.useState(false);
  const loadings = () => {};
  const speak = () => {
    setIsRecording(!isRecording);
  };
  const stopSpeak = () => {
    setIsRecording(!isRecording);
  };
  return (
    <div>
      <h2 className="mb-0">Voice To Gesture</h2>
      <p>View gestures from speech</p>
      <GestureCanvs />
      {isRecording ? (
        <Button
          className="flex flex-center-center w-100p"
          type="danger"
          loading={loadings[0]}
          onClick={() => stopSpeak(0)}
          icon={<FaRegPauseCircle />}
        >
          <span className="ml-2">Pause</span>
        </Button>
      ) : (
        <Button
          className="flex flex-center-center w-100p"
          type="primary"
          loading={loadings[1]}
          onClick={() => speak(1)}
          icon={<FaRegPlayCircle />}
        >
          <span className="ml-2">Collect</span>
        </Button>
      )}
    </div>
  );
};
