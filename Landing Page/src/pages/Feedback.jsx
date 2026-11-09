import React from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { feedbackPageDetails } from "../data/pageDetails";
import { Section } from "../components/marketing/Sections";
import { sendFeedback } from "../components/marketing/sendFeedback";
import { track } from "../components/marketing/track";
import "../marketing.css";

const IDENTITIES = ["Deaf", "Hard of hearing", "I cannot speak", "Hearing", "Prefer not to say"];
const PLACES = ["During a conversation", "On this website", "Somewhere else"];

const EMPTY = {
  name: "",
  email: "",
  identity: "",
  where: "",
  message: "",
  credit: false,
  asl: false,
};

function Feedback(props) {
  const { title, description } = feedbackPageDetails;
  const [params] = useSearchParams();
  const [kind, setKind] = React.useState(params.get("volunteer") ? "volunteer" : "feedback");
  const [form, setForm] = React.useState(() => ({
    ...EMPTY,
    where: params.get("from") === "conversation" ? PLACES[0] : "",
  }));
  const [state, setState] = React.useState({ busy: false, done: false, error: "" });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const volunteer = kind === "volunteer";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setState({ busy: false, done: false, error: "Please write a message first." });
      return;
    }
    if (volunteer && !form.email.trim()) {
      setState({ busy: false, done: false, error: "We need an email address to reach volunteers." });
      return;
    }
    setState({ busy: true, done: false, error: "" });
    try {
      const ok = await sendFeedback({ ...form, kind });
      if (!ok) throw new Error("send failed");
      track(volunteer ? "volunteer_signup" : "feedback_sent");
      setState({ busy: false, done: true, error: "" });
      setForm(EMPTY);
    } catch {
      setState({
        busy: false,
        done: false,
        error: "Your message was not sent. Try again, or use the Contact page.",
      });
    }
  };

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="Feedback and volunteers"
          title="Tell us what is wrong"
          lede="A wrong caption, a bad suggestion, a word that should never be used. Every message is read, and what changes goes into the monthly changelog."
        >
          <div className="cols">
            <form className="fb" onSubmit={submit} noValidate>
              <fieldset className="fb-kind">
                <legend className="eyebrow">I want to</legend>
                <label>
                  <input type="radio" name="kind" id="fb-kind-feedback" checked={!volunteer} onChange={() => setKind("feedback")} />
                  Report a problem or wording
                </label>
                <label>
                  <input type="radio" name="kind" id="fb-kind-volunteer" checked={volunteer} onChange={() => setKind("volunteer")} />
                  Volunteer as a tester
                </label>
              </fieldset>

              <label htmlFor="fb-identity">I am</label>
              <select id="fb-identity" value={form.identity} onChange={set("identity")}>
                <option value="">Choose one (optional)</option>
                {IDENTITIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>

              {!volunteer && (
                <>
                  <label htmlFor="fb-where">Where did it happen?</label>
                  <select id="fb-where" value={form.where} onChange={set("where")}>
                    <option value="">Choose one (optional)</option>
                    {PLACES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </>
              )}

              <label htmlFor="fb-message">{volunteer ? "Tell us a little about how you would use TalkMotion" : "What happened?"}</label>
              <textarea id="fb-message" rows={6} value={form.message} onChange={set("message")} />
              <p className="muted">Please do not include health details or private things someone said to you.</p>

              <label htmlFor="fb-name">Name (optional)</label>
              <input id="fb-name" type="text" value={form.name} onChange={set("name")} autoComplete="name" />

              <label htmlFor="fb-email">Email {volunteer ? "" : "(optional, if you want a reply)"}</label>
              <input id="fb-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" />

              {volunteer && (
                <label className="fb-check">
                  <input id="fb-asl" type="checkbox" checked={form.asl} onChange={set("asl")} />
                  I sign and could record ASL versions of pages
                </label>
              )}
              <label className="fb-check">
                <input id="fb-credit" type="checkbox" checked={form.credit} onChange={set("credit")} />
                You may thank me by name in the changelog
              </label>

              <button className="btn primary" type="submit" disabled={state.busy}>
                {state.busy ? "Sending" : volunteer ? "Sign up to volunteer" : "Send feedback"}
              </button>
              <div className="status" aria-live="polite" role="status">
                {state.done && (volunteer ? "Thank you. We will email you." : "Thank you. Your message was sent.")}
                {state.error && <span className="fb-error">{state.error}</span>}
              </div>
            </form>

            <div className="fb-aside">
              <h3>What volunteers do</h3>
              <ul className="list">
                <li>Use TalkMotion in real situations and tell us what went wrong.</li>
                <li>Read new pages and features before they go public, and tell us when the wording is off.</li>
                <li>If you sign, record ASL versions of pages so this site is not English-only.</li>
              </ul>
              <h3>What we promise</h3>
              <ul className="list">
                <li>Volunteering is unpaid, and we say so plainly.</li>
                <li>We never use your name without your yes on this form.</li>
                <li>Every month we publish what people told us and what we changed.</li>
                <li>You can stop at any time. Tell us through this form and we remove your details.</li>
              </ul>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

export default Feedback;
