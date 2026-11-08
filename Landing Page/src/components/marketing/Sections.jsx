import React from "react";
import { Link } from "react-router-dom";
import ConversationMock from "./ConversationMock";

const APP = "https://app.talk-motion.com";

export function Section({ id, alt, eyebrow, title, lede, children, note }) {
  return (
    <section id={id} className={`tm-section${alt ? " alt" : ""}`}>
      <div className="tm-wrap">
        {(eyebrow || title || lede) && (
          <div className="tm-head">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
            {lede && <p className="lede">{lede}</p>}
          </div>
        )}
        {children}
        {note && <p className="note">{note}</p>}
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <div className="tm-wrap hero">
      <div className="copy">
        <span className="eyebrow">Talk with anyone, in real time</span>
        <h1>Your words. Your voice. Your call.</h1>
        <p className="lede">
          They speak, you read. You answer your way. Nothing is spoken for you until you tap it.
        </p>
        <div className="btns">
          <a className="btn primary" href={`${APP}/signup`} target="_blank" rel="noreferrer">
            Try a conversation, free
          </a>
          <Link className="btn secondary" to="/how-it-works">
            See how it works
          </Link>
        </div>
        <p className="muted">Works in the browser on your phone. Nothing to install.</p>
      </div>
      <ConversationMock />
    </div>
  );
}

export const STEPS = [
  {
    n: "01",
    title: "They speak, you read",
    body: "Live captions of the hearing person, with their name on each line. Turn on plain language if you want shorter sentences.",
  },
  {
    n: "02",
    title: "You answer your way",
    body: "Type, or tap one of the replies the tool suggests from what was just said. Edit anything.",
  },
  {
    n: "03",
    title: "You confirm",
    body: "Nothing is spoken until you tap Speak. Every suggestion is a draft until you say so.",
    confirm: true,
  },
  {
    n: "04",
    title: "It speaks for you",
    body: "In a natural voice you choose. The other person hears you at conversation speed.",
  },
];

export function Steps() {
  return (
    <div className="steps">
      {STEPS.map((s) => (
        <article key={s.n} className={`step${s.confirm ? " confirm" : ""}`}>
          <div className="n">{s.n}</div>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </article>
      ))}
    </div>
  );
}

export function YourPart() {
  return (
    <div className="share">
      <div>
        <h3>Small on purpose</h3>
        <p className="muted">You are in a conversation. The tool does the listening and the waiting.</p>
      </div>
      <div>
        <span className="eyebrow">You</span>
        <ul>
          <li>Open the app</li>
          <li>Read what they said</li>
          <li>Pick a reply or type one</li>
          <li>Tap Speak</li>
        </ul>
      </div>
      <div className="ours">
        <span className="eyebrow">The tool</span>
        <ul>
          <li>Listens and captions</li>
          <li>Suggests replies</li>
          <li>Waits for you</li>
          <li>Speaks only what you confirmed</li>
        </ul>
      </div>
    </div>
  );
}

export function Wedges() {
  return (
    <div className="wedges">
      <article className="wedge">
        <span className="eyebrow">If you are Deaf or hard of hearing</span>
        <h3>The counter, the clinic, the call</h3>
        <p>
          Short conversations where no interpreter is present. Read what they say as captions, answer from your
          phone, and confirm before anything is spoken.
        </p>
        <a className="btn secondary" href={`${APP}/signup`} target="_blank" rel="noreferrer">
          Start free
        </a>
      </article>
      <article className="wedge">
        <span className="eyebrow">If you cannot speak</span>
        <h3>Speak at conversation speed</h3>
        <p>
          Type or tap a suggested reply and TalkMotion says it in a natural voice. It hears the other person too, so
          you are never guessing what was said.
        </p>
        <a className="btn secondary" href={`${APP}/signup`} target="_blank" rel="noreferrer">
          Try the voice
        </a>
      </article>
    </div>
  );
}

export function VenueTimeline() {
  const items = [
    { pill: "Day one", title: "A tablet at the counter", body: "Open the app, sign in, done. No install, no IT ticket." },
    { pill: "Week one", title: "Staff walkthrough", body: "Twenty minutes. Speak normally. Wait for the reply. That is the training." },
    { pill: "Every visit", title: "Served without the wait", body: "The customer reads your words as captions and answers from the tablet or their own phone." },
    { pill: "Every reply", title: "They confirm. It speaks.", body: "Your customer stays in control of every word said on their behalf.", hot: true },
  ];
  return (
    <div className="timeline">
      {items.map((t) => (
        <div key={t.pill} className={`tl${t.hot ? " hot" : ""}`}>
          <div className="rail">
            <span className="dot" />
            <span className="rule" />
          </div>
          <span className={`pill${t.hot ? " confirm" : ""}`}>{t.pill}</span>
          <h3>{t.title}</h3>
          <p>{t.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Cta({ title, body, href, label, to }) {
  return (
    <div className="tm-wrap">
      <div className="cta">
        <h2>{title}</h2>
        <p>{body}</p>
        {to ? (
          <Link className="btn primary" to={to}>
            {label}
          </Link>
        ) : (
          <a className="btn primary" href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        )}
      </div>
    </div>
  );
}

export { APP };
