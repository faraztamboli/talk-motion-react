import React from "react";
import JS2Py from "../remotepyjs";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function useSpeechRecognitionHook() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [video, setVideo] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const {
    transcript,
    //  listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  React.useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return "Browser doesn't support speech recognition.";
    }
    getVideo(getWords(transcript));
  }, [transcript, browserSupportsSpeechRecognition]);

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
      JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(
        words,
        (res) => {
          // console.log(res);
          let elemArr = new Array();
          Object.keys(res[0]).forEach((element, index) => {
            const elemVideo =
              res && res[0] && res[0][res[1][index]]?.is_remote === false
                ? res[0][res[1][index]]?.video_stream
                : res[0][res[1][index]]?.remote_url;
            elemVideo !== undefined && elemArr.push(elemVideo);
            // console.log(res && res[0] && res[0][res[1][index]]?.is_remote);
          });
          setLoading(true);
          setVideo(elemArr);
          // console.log(res);
        }
      );
    } catch (error) {
      console.log(error);
    }
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
    loading,
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
