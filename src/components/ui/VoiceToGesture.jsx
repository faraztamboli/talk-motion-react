import React from 'react';
import { Button } from 'antd';
import { FaMicrophoneAlt, FaRegStopCircle } from 'react-icons/fa';

export const VoiceToGesture = () => {
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
      <video src="" controls className="block w-100p mb-6"></video>
      {isRecording ? (
        <Button
          className="flex w-100p flex-center-center"
          type="danger"
          loading={loadings[0]}
          onClick={() => stopSpeak(0)}
          icon={<FaRegStopCircle />}
        >
          <span className="ml-2">Stop</span>
        </Button>
      ) : (
        <Button
          className="flex w-100p flex-center-center"
          type="primary"
          loading={loadings[1]}
          onClick={() => speak(1)}
          icon={<FaMicrophoneAlt />}
        >
          <span className="ml-2">Speak</span>
        </Button>
      )}

      <div className="pt-4">
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti cum a minus temporibus nobis, maxime in eos
          eius ipsam recusandae quos necessitatibus totam magni saepe minima dolores harum laboriosam? Temporibus?
        </p>
      </div>
    </div>
  );
};
