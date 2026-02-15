import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import JS2Py from "../remotepyjs";

// Lazy initialization of SpeechRecognition to avoid module load errors
let mic = null;
let SpeechRecognition = null;

function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!SpeechRecognition) {
    SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  }
  return SpeechRecognition;
}

function initializeMic() {
  if (mic) {
    return mic;
  }
  const SpeechRecognitionClass = getSpeechRecognition();
  if (!SpeechRecognitionClass) {
    console.warn("SpeechRecognition is not available in this browser");
    return null;
  }
  try {
    mic = new SpeechRecognitionClass();
    mic.continuous = true;
    mic.interimResults = true;
    mic.lang = "en-US";
    return mic;
  } catch (error) {
    console.error("Failed to initialize SpeechRecognition:", error);
    return null;
  }
}

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wordsToPlay, setWordsToPlay] = useState([]);
  const [wordVideoDictionary, setWordVideoDictionary] = useState({});
  const videoRef = useRef(null);
  const micRef = useRef(null);

  const { modelId } = useSelector((state) => state.model);

  // Initialize mic on mount
  useEffect(() => {
    micRef.current = initializeMic();
    if (micRef.current) {
      micRef.current.onstart = function (event) {
        console.log("onstart", event);
        setIsListening(true);
      };
      micRef.current.onend = function (event) {
        console.log("onend", event);
        setIsListening(false);
      };
      micRef.current.onerror = function (event) {
        console.log("onerrror", event);
      };
    }
    return () => {
      if (micRef.current) {
        try {
          micRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Helper functions - defined before useEffects that use them
  function playWord(word) {
    if (wordVideoDictionary[modelId] !== undefined) {
      if (word in wordVideoDictionary[modelId]) {
        if (videoRef.current) {
          // Ensure video has dimensions before loading
          if (!videoRef.current.width || videoRef.current.width === 0) {
            videoRef.current.width = videoRef.current.offsetWidth || 640;
          }
          if (!videoRef.current.height || videoRef.current.height === 0) {
            videoRef.current.height = videoRef.current.offsetHeight || 360;
          }
          
          videoRef.current.classList.remove("bg-black");
          videoRef.current.src = wordVideoDictionary[modelId][word]["remote_url"];
          videoRef.current.defaultPlaybackRate = 2.0;
          videoRef.current.load();
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

  function getVideo(words) {
    let short_list = [];
    let locally_available_words = [];
    for (let i in words) {
      if (
        wordVideoDictionary[modelId] === undefined ||
        !(words[i] in wordVideoDictionary[modelId]) || true
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
      const micLang = micRef.current ? micRef.current.lang : "en-US";
      JS2Py.PythonFunctions.TalkMotionServer.translateWordsToGestures(
        modelId,
        short_list,
        micLang,
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

  useEffect(() => {
    let word = wordsToPlay.shift();
    if (word !== undefined) {
      playWord(word);
    }
  }, [wordsToPlay, modelId, wordVideoDictionary]);

  function startListening() {
    if (!micRef.current) {
      micRef.current = initializeMic();
      if (!micRef.current) {
        console.error("SpeechRecognition is not available");
        return;
      }
    }
    setIsListening(true);
    try {
      micRef.current.start();
    } catch (error) {
      console.error("Failed to start listening:", error);
      setIsListening(false);
    }
  }

  function stopListening() {
    setIsListening(false);
    if (micRef.current) {
      try {
        micRef.current.stop();
      } catch (error) {
        console.error("Failed to stop listening:", error);
      }
    }
  }


  // Set up onresult handler
  useEffect(() => {
    if (micRef.current) {
      // Override array shift with a special shift
      const originalShift = Array.prototype.shift;
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

      micRef.current.onresult = function (event) {
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
        // console.log("Final", transcript);
      };

      return () => {
        // Restore original shift
        Array.prototype.shift = originalShift;
      };
    }
  }, [modelId, wordVideoDictionary]);

  // Set up video onended handler
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onended = (event) => {
        // console.log(event, wordsToPlay);
        let word = wordsToPlay.shift();
        if (word !== undefined) {
          playWord(word);
        }
      };
    }
  }, [wordsToPlay, modelId, wordVideoDictionary]);

  return {
    startListening,
    stopListening,
    isListening,
    videoRef,
    transcript,
  };
}

export default useSpeechRecognition;
