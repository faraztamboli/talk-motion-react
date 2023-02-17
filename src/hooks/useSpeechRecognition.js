import { useState } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();

mic.continuous = true;
mic.interimResults = true;
mic.lang = "en-US";

function useVoiceToGesture() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
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
      } else {
        interimTranscript += event.results[i][0].transcript;
        setTranscript(interimTranscript);
      }
    }
  };

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    setTranscript,
  };
}

export default useVoiceToGesture;
