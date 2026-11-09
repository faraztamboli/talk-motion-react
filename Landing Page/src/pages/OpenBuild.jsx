import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { openBuildPageDetails } from "../data/pageDetails";
import { Section, Cta } from "../components/marketing/Sections";
import "../marketing.css";

/* Mirrors talkmotion/server/docs/marketing/05-claims-register.md. Update both together. */
const CLAIMS = [
  { claim: "Live captions of the hearing speaker", status: "live" },
  { claim: "Plain-language rewrite of what was said", status: "live" },
  { claim: "Suggested replies you can tap, edit or ignore", status: "live" },
  { claim: "Nothing is spoken until you tap Speak", status: "live" },
  { claim: "Natural voice output in under a second", status: "live" },
  { claim: "Choose the voice your replies are spoken in", status: "live" },
  { claim: "Captions say who said what, even on a shared phone", status: "live" },
  { claim: "Join a conversation from a second phone by code", status: "live" },
  { claim: "Works in a phone browser, nothing to install", status: "live" },
  { claim: "A reminder in every conversation to ask for an interpreter when it matters", status: "live" },
  { claim: "Your transcripts: save them as text, or delete them", status: "live" },
  { claim: "Tap a word in a caption to see a sign video, where we have one", status: "live" },
  { claim: "Pharmacies and clinics: staff accounts and a monthly summary that counts, never reads", status: "live" },
  { claim: "Private mode at pharmacies and clinics: what is said stays on our servers and the phones in the conversation", status: "live" },
  { claim: "Quick-phrase sets for the doctor, the pharmacy, work", status: "soon" },
  { claim: "Your own cloned voice, with recorded consent", status: "soon" },
  { claim: "Fingerspelling and number recognition", status: "soon" },
  { claim: "Sign videos recorded by Deaf signers for common words", status: "soon" },
  { claim: "Sign recognition for a curated vocabulary (draft you confirm)", status: "soon" },
  { claim: "Reads continuous signing (as a draft you confirm)", status: "soon" },
  { claim: "Replaces interpreters", status: "no" },
  { claim: "Animated signing avatar", status: "no" },
];

const LABEL = { live: "Live now", soon: "Not yet", no: "Not a goal" };

function OpenBuild(props) {
  const { title, description } = openBuildPageDetails;
  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="Built in the open"
          title="What we claim, and what we do not"
          lede="Tools for Deaf people have a history of promising more than they deliver. This page lists exactly what TalkMotion does today."
        >
          <div className="tablewrap">
            <table className="claims">
              <thead>
                <tr>
                  <th scope="col">Claim</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {CLAIMS.map((c) => (
                  <tr key={c.claim}>
                    <td>{c.claim}</td>
                    <td>
                      <span className={`tag ${c.status === "live" ? "" : c.status}`}>{LABEL[c.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">
            We update this list when features ship, not before. Anything marked "Not yet" has no date.
          </p>
        </Section>

        <Section alt eyebrow="Our policies" title="Four rules we hold ourselves to">
          <div className="cols">
            <div>
              <h3>You control every word</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Nothing is spoken on your behalf without your tap. Suggestions are drafts. The older Translator page
                from our first prototype works the same way: a recognized sign waits for your tap, unless you turn on
                Speak automatically yourself. If we add sign recognition to conversations, it will produce drafts too.
              </p>
            </div>
            <div>
              <h3>Interpreters come first</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                TalkMotion does not replace interpreters. For medical, legal and financial conversations, book one.
                Every conversation shows a reminder that says the same, with a one-tap request.
              </p>
            </div>
            <div>
              <h3>Only Deaf users judge accuracy</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                We publish no accuracy numbers from hearing testers. When we publish any, they will come from Deaf
                users and link to how they were measured.
              </p>
            </div>
            <div>
              <h3>Your data stays yours</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Conversations are yours to save or delete in My conversations. A deleted conversation leaves our nightly
                backups within 35 days. At pharmacies and clinics, private mode keeps what is said on our servers and
                the phones in the conversation, and deletes the words 15 minutes after it ends. We do not sign HIPAA
                business associate agreements yet. Cloned voices will require your recorded consent. This website
                counts visits per day without cookies or ad trackers, and our visit counter never stores your IP
                address. Details are in our <Link to="/privacy-policy">privacy policy</Link>.
              </p>
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Help us get it right"
          title="Volunteer testers"
          lede="We are a small team building with AI, and we do not pretend to speak for the Deaf community. If you are Deaf, hard of hearing or cannot speak, your feedback changes what we build. We credit you by name if you want, and never without asking."
        >
          <ul className="list">
            <li>Use TalkMotion in a real situation and tell us what went wrong.</li>
            <li>Tell us when our wording is off. We already took "translate" off this site because it promised more than the tool does.</li>
            <li>If you sign on camera, you can record the ASL version of a page so this site is not English-only.</li>
          </ul>
          <div className="btns" style={{ marginTop: 24 }}>
            <Link className="btn primary" to="/feedback?volunteer=1">
              Volunteer as a tester
            </Link>
            <Link className="btn secondary" to="/feedback">
              Send feedback
            </Link>
          </div>
          <p className="note">
            Partner notes: <a href="/one-pagers/deaf-organizations.pdf">for Deaf organizations</a>,{" "}
            <a href="/one-pagers/interpreter-agencies.pdf">for interpreter agencies</a>. Volunteers are not paid, and we say so. Inside a conversation, "Report a problem" opens the same feedback
            form.
          </p>
        </Section>

        <section className="tm-section">
          <Cta
            title="Changelog"
            body="Every month we publish what people told us and what we changed. The first entry appears after the first volunteers have spoken."
            to="/feedback"
            label="Tell us what to change"
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

export default OpenBuild;
