import { useEffect } from "react";
import { useSelector } from "react-redux";

function useSpeechSynthesis() {
  const { volume } = useSelector((state) => state.speech);
  useEffect(() => {
    msg.volume = volume;
  }, [volume]);

  var msg = new SpeechSynthesisUtterance();

  function speak(text) {
    // var voices = window.speechSynthesis.getVoices();
    // msg.voice = voices[$('#voicelist').val()];
    msg.text = text;
    console.log(msg.volume, volume);
    // eslint-disable-next-line
    msg.onend = function (e) {
      console.log("Finished in " + event.elapsedTime + " seconds.");
    };
    speechSynthesis.speak(msg);
  }

  return { speak };
}

export default useSpeechSynthesis;
