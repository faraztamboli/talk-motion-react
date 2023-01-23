import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import JS2Py from "../remotepyjs";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();

mic.continuous = true;
mic.interimResults = true;
mic.lang = "en-US";

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wordsToPlay, setWordsToPlay] = useState([]);
  const [wordVideoDictionary, setWordVideoDictionary] = useState({});
  const videoRef = useRef(null);

  const { modelId } = useSelector((state) => state.model);

  useEffect(() => {
    let word = wordsToPlay.shift();
    playWord(word);
  }, [wordsToPlay]);

  mic.onstart = function (event) {
    console.log("onstart", event);
    setIsListening(true);
  };
  mic.onend = function (event) {
    console.log("onend", event);
    setIsListening(false);
  };
  mic.onerror = function (event) {
    console.log("onerrror", event);
  };

  function startListening() {
    setIsListening(true);
    mic.start();
  }

  function stopListening() {
    setIsListening(false);
    mic.stop();
  }

  mic.onresult = function (event) {
    let finalTranscript = "";
    let interimTranscript = "";
    let results = event["results"];

    for (let i = event.resultIndex; i < results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
        finalTranscript = finalTranscript.trimStart();
        finalTranscript = finalTranscript.toLowerCase();
        setTranscript(finalTranscript);
        // console.log(finalTranscript);
        if (finalTranscript !== "") {
          let words = finalTranscript.split(" ");
          getVideo(words);
        }
      } else {
        interimTranscript += event.results[i][0].transcript;
        setTranscript(interimTranscript);
      }
    }

    function getVideo(words) {
      let short_list = [];
      for (let i in words) {
        if (
          wordVideoDictionary[modelId] === undefined ||
          !(words[i] in wordVideoDictionary[modelId])
        ) {
          short_list.push(words[i]);
        }
      }

      if (short_list === undefined || short_list.length == 0) {
        setWordsToPlay((prevState) => [prevState, ...words]);
        let word = wordsToPlay.shift();
        if (word !== undefined) {
          playWord(word);
        }
      } else {
        // console.log("Dict", wordVideoDictionary);
        JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(
          modelId,
          short_list,
          function (result) {
            // console.log(result);
            words = result[1];
            result = result[0];
            for (let key in result) {
              setWordVideoDictionary((prevState) => ({
                ...prevState,
                [modelId]: { ...prevState[modelId], [key]: result[key] },
              }));
            }
            setWordsToPlay((prevState) => [prevState, ...words]);
            let word = wordsToPlay.shift();
            // console.log(word);
            if (word !== undefined) {
              playWord(word);
            }
          }
        );
      }
    }
    // console.log("Final", transcript);
  };

  function playWord(word) {
    if (wordVideoDictionary[modelId] !== undefined) {
      if (word in wordVideoDictionary[modelId]) {
        videoRef.current.classList.remove("bg-black");
        videoRef.current.src = wordVideoDictionary[modelId][word]["remote_url"];
        videoRef.current.play();
      } else {
        word = wordsToPlay.shift();
        if (word !== undefined) {
          playWord(word);
        }
      }
    }
  }

  if (videoRef.current) {
    // eslint-disable-next-line
    videoRef.current.onended = (event) => {
      // console.log(event, wordsToPlay);
      let word = wordsToPlay.shift();
      if (word !== undefined) {
        playWord(word);
      }
    };
  }

  return {
    startListening,
    stopListening,
    isListening,
    videoRef,
    transcript,
  };
}

export default useSpeechRecognition;
