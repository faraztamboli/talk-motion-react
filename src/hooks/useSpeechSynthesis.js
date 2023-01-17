import { useSelector } from "react-redux";

function useSpeechSynthesis() {
  const { voice } = useSelector((state) => state.speech);
  const speech = window.speechSynthesis;
  const voicesList = speech.getVoices();

  function speak(text, volume) {
    var msg = new SpeechSynthesisUtterance();
    msg.volume = volume;
    msg.text = text !== null ? text : "";

    if (voice) {
      for (let i = 0; i < voicesList.length; i++) {
        if (voicesList[i].name === voice) {
          msg.voice = voicesList[i];
        }
      }
    }

    // eslint-disable-next-line
    msg.onend = function (e) {
      console.log("Finished in " + event.elapsedTime + " seconds.");
    };
    speechSynthesis.speak(msg);
  }

  return { speak };
}

export default useSpeechSynthesis;
