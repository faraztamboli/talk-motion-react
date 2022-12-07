import React from "react";
import JS2Py from "../remotepyjs";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function useSpeechRecognitionHook() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [video, setVideo] = React.useState(null);
  const [count, setCount] = React.useState(0);
  const {
    transcript,
    //  listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // React.useEffect(() => {
  //   if (!browserSupportsSpeechRecognition) {
  //     return <span>Browser doesn't support speech recognition.</span>
  //   }
  //   getVideo(getWords(transcript));
  // }, []);

  React.useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return "Browser doesn't support speech recognition.";
    }
    getVideo(getWords(transcript));
  }, [transcript, browserSupportsSpeechRecognition]);

  const loadings = () => {};

  const handleStopSpeak = () => {
    setIsRecording(!isRecording);
    SpeechRecognition.stopListening();
  };

  const handleStartSpeak = () => {
    /* resetTranscript();
    setCount(0); */
    setIsRecording(!isRecording);
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleResetTranscript = () => {
    resetTranscript();
    setCount(0);
    setVideo(null);
  };

  const getWords = (transcript) => {
    return transcript && transcript.split(" ");
  };

  const getVideo = (words) => {
    try {
      // console.log('inside getVideo function : ', JS2Py);
      JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(
        words,
        (res) => {
          setVideo(objToArr(res));
          // setVideo(res);
          // console.log(res);
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const objToArr = (obj) => {
    const arr = obj && Object.values(obj);
    return arr;
  };

  const videoSrc = (arr) => {
    let src = arr[count];
    return src;
  };

  const handleRepeat = () => {
    setCount(0);
    getVideo(getWords(transcript));
  };

  // console.log(video);

  return {
    transcript,
    video,
    setVideo,
    count,
    setCount,
    videoSrc,
    isRecording,
    setIsRecording,
    handleStartSpeak,
    handleStopSpeak,
    handleRepeat,
    handleResetTranscript,
  };
}

export default useSpeechRecognitionHook;
