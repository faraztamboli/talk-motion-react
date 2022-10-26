import React from 'react';
import JS2Py from '../../remotepyjs';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

import { Button } from 'antd';
import { FaMicrophoneAlt, FaRegStopCircle } from 'react-icons/fa';

export const VoiceToGesture = () => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [video, setVideo] = React.useState();
  const [count, setCount] = React.useState(0);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  // React.useEffect(() => {
  //   if (!browserSupportsSpeechRecognition) {
  //     return <span>Browser doesn't support speech recognition.</span>;
  //   }
  //   getVideo(getWords(transcript));
  // }, []);

  React.useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return <span>Browser doesn't support speech recognition.</span>;
    }
    getVideo(getWords(transcript));
  }, [transcript, browserSupportsSpeechRecognition]);

  const loadings = () => {};

  const handleStopSpeak = () => {
    setIsRecording(!isRecording);
    SpeechRecognition.stopListening();
  };

  const handleStartSpeak = () => {
    setIsRecording(!isRecording);
    SpeechRecognition.startListening();
  };

  const getWords = transcript => {
    return transcript && transcript.split(' ');
  };

  const getVideo = words => {
    try {
      words = ['hello', 'how', 'are', 'you'];
      console.log('inside getVideo function : ', JS2Py);
      JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(words, res => {
        setVideo(res);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const videoSrc = arr => {
    let src = arr[count];
    return src;
  };

  const objToArr = obj => {
    const arr = obj && Object.values(obj);
    return arr;
  };

  console.log(video);

  return (
    <div>
      <h2 className="mb-0">Voice To Gesture</h2>
      <p>View gestures from speech</p>
      <video
        src={video && videoSrc(objToArr(video))}
        // style={!video ? { backgroundColor: 'black' } : null}
        // controls
        className="block w-100p mb-6"
        autoPlay
        muted
        onEnded={() => {
          if (count === objToArr(video).length) {
            setCount(0);
          }
          setCount(prevCount => prevCount + 1);
        }}
      ></video>
      {isRecording ? (
        <Button
          className="flex w-100p flex-center-center"
          type="danger"
          loading={loadings[0]}
          onClick={handleStopSpeak}
          icon={<FaRegStopCircle />}
        >
          <span className="">Stop</span>
        </Button>
      ) : (
        <Button
          className="flex w-100p flex-center-center"
          type="primary"
          loading={loadings[1]}
          // onClick={() => speak(1)}
          onClick={handleStartSpeak}
          icon={<FaMicrophoneAlt />}
        >
          <span className="">Speak</span>
        </Button>
      )}

      <div className="pt-4">
        <p>{transcript}</p>
      </div>
    </div>
  );
};
