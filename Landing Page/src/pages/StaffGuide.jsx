import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { staffGuidePageDetails } from "../data/pageDetails";
import { Section } from "../components/marketing/Sections";
import "../marketing.css";

/* Mirrors public/one-pagers/staff-guide.html (the printable version). Update both together. */

function StaffGuide(props) {
  const { title, description } = staffGuidePageDetails;
  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="For pharmacy and clinic staff"
          title="Staff guide: twenty minutes, including a practice run"
          lede="How to serve a Deaf or non-speaking customer with TalkMotion at your counter."
          note={
            <>
              Printable version: <a href="/one-pagers/staff-guide.pdf">staff guide (PDF)</a>.
            </>
          }
        >
          <div className="guide">
            <article>
              <h3>1. Before your first customer (5 minutes)</h3>
              <ul className="list">
                <li>
                  Create a free account at <strong>app.talk-motion.com</strong>, then ask your location&apos;s admin to add
                  you as staff.
                </li>
                <li>On the counter tablet, open app.talk-motion.com and sign in.</li>
                <li>Put the tablet on a stand where the customer can read it. Turn the volume up.</li>
              </ul>
            </article>

            <article>
              <h3>2. A conversation</h3>
              <ol className="list">
                <li>
                  Open <strong>Conversation</strong>, choose <strong>I can hear and speak</strong>, and check that your
                  location is selected. Tap <strong>Start</strong>.
                </li>
                <li>
                  Switch on <strong>Listen to speech</strong>. Your words now appear as captions.
                </li>
                <li>
                  Turn the tablet toward the customer, or tap <strong>Add a phone</strong> so they can join on their own
                  phone with the code.
                </li>
                <li>Speak normally, one or two sentences at a time. Then wait.</li>
                <li>
                  The customer reads, types a reply and taps <strong>Speak</strong>. Only then does the tablet say it
                  aloud.
                </li>
                <li>
                  When you are done, tap <strong>End</strong>.
                </li>
              </ol>
            </article>

            <article>
              <h3>3. When something goes wrong</h3>
              <ul className="list">
                <li>A caption is wrong: say it again in different words.</li>
                <li>The customer would rather use their own phone: tap Add a phone and show them the code.</li>
                <li>
                  It is about their health, the law or money: offer a qualified interpreter. TalkMotion helps when none is
                  available. It does not replace one.
                </li>
                <li>No sound: check the volume, then ask the customer to tap Speak again.</li>
                <li>The customer prefers pen and paper: that is fine too.</li>
              </ul>
            </article>

            <article>
              <h3>4. Courtesy</h3>
              <ul className="list">
                <li>Look at the customer, not only at the screen.</li>
                <li>Never type or tap Speak for them. Their words are theirs.</li>
                <li>Do not read their reply aloud before they tap Speak.</li>
              </ul>
            </article>

            <article>
              <h3>5. Afterwards</h3>
              <ul className="list">
                <li>
                  Your location uses <strong>private mode</strong> unless your admin turned it off. What is said stays
                  on TalkMotion&apos;s servers and these phones, replies use the tablet&apos;s own voice, and there are
                  no suggested replies.
                </li>
                <li>
                  In private mode, the words are deleted 15 minutes after you tap End. If the customer wants a copy,
                  they tap <strong>Save transcript</strong> on their own phone before then.
                </li>
                <li>
                  Your location&apos;s monthly summary counts conversations. It never includes what anyone said.
                </li>
              </ul>
            </article>

            <article>
              <h3>6. Practice run (10 minutes, with a colleague)</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Your colleague plays a customer picking up a new prescription, using their own phone and the code. Ask
                about allergies, explain how often to take it, and ask if they have questions. Then swap roles. Try one
                mistake on purpose: mumble a sentence and see how you repair it.
              </p>
            </article>
          </div>
          <p className="note">
            Questions or problems: <Link to="/feedback">tell us</Link>. Every message is read.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

export default StaffGuide;
