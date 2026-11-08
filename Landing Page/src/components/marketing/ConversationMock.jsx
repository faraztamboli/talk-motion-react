import React from "react";

const SUGGESTIONS = ["No allergies", "Yes, penicillin", "Let me check my list"];

/* A small, honest mock of the Conversation screen: caption from the hearing speaker,
   suggested replies, a text box, and the only green button on the site. */
function ConversationMock() {
  const [picked, setPicked] = React.useState(null);
  const [text, setText] = React.useState("");
  const [status, setStatus] = React.useState("Nothing is spoken until you tap Speak.");

  const choose = (s) => {
    setPicked(s);
    setText(s);
    setStatus("Draft ready. Nothing is spoken until you tap Speak.");
  };

  const speak = () => {
    if (!text) {
      setStatus("Pick a reply or type one first.");
      return;
    }
    setStatus(`Spoken: "${text}"`);
  };

  return (
    <div className="convo" aria-label="Example conversation">
      <div className="caption">
        <span className="who">Pharmacist</span>
        <span className="txt">Do you have any allergies to penicillin or other medications?</span>
      </div>
      <div className="chips" role="group" aria-label="Suggested replies">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={picked === s}
            onClick={() => choose(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <label htmlFor="tm-compose" className="muted">
        Or type your reply
      </label>
      <input
        id="tm-compose"
        className="compose"
        type="text"
        value={text}
        placeholder="Type here"
        onChange={(e) => {
          setText(e.target.value);
          setPicked(null);
          setStatus(
            e.target.value
              ? "Draft ready. Nothing is spoken until you tap Speak."
              : "Nothing is spoken until you tap Speak."
          );
        }}
      />
      <button type="button" className="btn speak" onClick={speak} aria-describedby="tm-status">
        Speak
      </button>
      <div className="status" id="tm-status" aria-live="polite">
        {status}
      </div>
    </div>
  );
}

export default ConversationMock;
