function useSpeechSynthesis() {
  // const { volume } = useSelector((state) => state.speech);

  function speak(text, volume) {
    var msg = new SpeechSynthesisUtterance();
    // var voices = window.speechSynthesis.getVoices();
    // msg.voice = voices[$('#voicelist').val()];
    msg.volume = volume;
    msg.text = text !== null ? text : "";
    // eslint-disable-next-line
    msg.onend = function (e) {
      console.log("Finished in " + event.elapsedTime + " seconds.");
    };
    speechSynthesis.speak(msg);
  }

  return { speak };
}

export default useSpeechSynthesis;
