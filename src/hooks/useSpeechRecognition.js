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

    // special shift looks at the word dictionary and if it finds the bigger string it returns it
    // otherwise it returns the individual words
    // function returns word to remove and remaining word array after removal
    // in case of phrases found in dictionary it remove multiple words making the phrase
    function special_shift(words) {
      let separator = " ";
      let i = 0;
      let j = 0;
      while (j < words.length) {
        let phrase_to_remove =
          j > 0 ? words.slice(i, -j).join(separator) : words.join(separator);
        if (wordVideoDictionary[modelId] === undefined) {
          let word_to_remove = words[0];
          words = words.length > 0 ? words.slice(1) : null;
          return [word_to_remove, words];
        }
        if (phrase_to_remove in wordVideoDictionary[modelId]) {
          // remove selected phrase
          words = j > 0 ? words.slice(-j) : null;
          return [phrase_to_remove, words];
        }
        j++;
      }
      let word_to_remove = words[0];
      words = words.length > 0 ? words.slice(1) : null;
      return [word_to_remove, words];
    }

    // override array shift with a special shift
    Array.prototype.shift = function () {
      // console.log(this);
      let output = special_shift(this);
      let phrase = output[0];
      let remaining = output[1];
      // pop out all elements from existing array
      while (this.length > 0) {
        this.pop();
      }
      // copy remaining elements after special shifting to this array
      for (let i in remaining) {
        this.push(remaining[i]);
      }
      // return the popped word or phrase
      return phrase;
    };

    function getVideo(words) {
      let short_list = [];
      let locally_available_words = [];
      for (let i in words) {
        if (
          wordVideoDictionary[modelId] === undefined ||
          !(words[i] in wordVideoDictionary[modelId])
        ) {
          short_list.push(words[i]);
        } else {
          locally_available_words.push(words[i]);
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
          mic.lang,
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
            if (locally_available_words.length > 0) {
              words = locally_available_words.concat(words);
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
        let promise = videoRef.current.play();
        if (promise !== undefined) {
          promise
            .catch((error) => {
              // Auto-play was prevented
              // Show a UI element to let the user manually start playback
              console.log(error);
              videoRef.current.muted = true;
              videoRef.current.play();
            })
            .then(() => {
              // Auto-play started
            });
        }
      } else {
        //TODO: if word is not in the dictionary then try fingerspelling it
        // for this you need to get all alphabets in initial call
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
