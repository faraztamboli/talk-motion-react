import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { pricingPageDetails } from "../data/pageDetails";
import { Section, Cta, APP } from "../components/marketing/Sections";
import "../marketing.css";

function Pricing(props) {
  const { title, description } = pricingPageDetails;
  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="Pricing"
          title="Free for the people it is for"
          lede="Individuals who are Deaf, hard of hearing or cannot speak use TalkMotion free. Venues and organizations pay, so that stays true."
        >
          <div className="tiers">
            <article className="tier featured">
              <span className="eyebrow">Individuals</span>
              <div className="price">
                Free <small>always</small>
              </div>
              <ul>
                <li>Live captions of the hearing speaker</li>
                <li>Plain-language rewrite</li>
                <li>Suggested replies you tap or edit</li>
                <li>Natural voice output, confirmed by you</li>
                <li>Choose the voice your replies use</li>
                <li>Join from a second phone by code</li>
                <li>Your transcripts, kept for you to save or delete</li>
              </ul>
              <a className="btn primary" href={`${APP}/signup`} target="_blank" rel="noreferrer">
                Start free
              </a>
            </article>
            <article className="tier">
              <span className="eyebrow">Pharmacies and clinics</span>
              <div className="price">
                Per location <small>pilot pricing</small>
              </div>
              <ul>
                <li>A counter tablet set up in an afternoon</li>
                <li>
                  A twenty-minute <Link to="/staff-guide">staff guide</Link>
                </li>
                <li>Customers join from their own phone</li>
                <li>Add and remove staff yourself</li>
                <li>Monthly accessibility summary, counts only</li>
                <li>Private mode: what is said stays on our servers, and is deleted after each conversation</li>
              </ul>
              <Link className="btn secondary" to="/contact-us">
                Ask about a pilot
              </Link>
              <a className="muted" href="/one-pagers/pharmacies.pdf">
                Pharmacy one-pager (PDF)
              </a>
            </article>
            <article className="tier">
              <span className="eyebrow">Organizations</span>
              <div className="price">
                Custom <small>schools, hospitals, employers</small>
              </div>
              <ul>
                <li>Many locations or many staff</li>
                <li>Admins manage staff for each location</li>
                <li>A monthly summary for every location</li>
                <li>Pay by invoice</li>
              </ul>
              <Link className="btn secondary" to="/contact-us">
                Talk to us
              </Link>
            </article>
          </div>
          <p className="note">
            Existing TalkMotion customers keep everything they bought or subscribed to. Nothing you own is taken away.
          </p>
        </Section>

        <Section alt eyebrow="Questions" title="Plain answers">
          <div className="cols">
            <div>
              <h3>Why free?</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Because the person at the pharmacy counter should not pay to be understood. The speech recognition runs
                on our own servers, which keeps our cost low enough to make this promise.
              </p>
            </div>
            <div>
              <h3>What will cloned voices cost?</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Not decided. Cloned voices are not available yet. When they are, they may be a paid extra, and will
                always require your recorded consent.
              </p>
            </div>
            <div>
              <h3>Does a venue licence cover my customers?</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Yes. Customers never pay. They can use the counter tablet or join from their own phone with a code.
              </p>
            </div>
            <div>
              <h3>Can I cancel?</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Yes, any time.
              </p>
            </div>
            <div>
              <h3>Is it HIPAA compliant?</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                We do not sign HIPAA business associate agreements yet. Private mode, on by default at every location,
                keeps what is said on our own servers and the phones in the conversation. Replies use the phone&apos;s
                own voice, there are no AI suggestions, and the words are deleted 15 minutes after each conversation
                ends. Ask your privacy officer before using TalkMotion for conversations about prescriptions or health.
              </p>
            </div>
          </div>
        </Section>

        <section className="tm-section">
          <Cta
            title="Pharmacy or clinic? Pilot with us."
            body="We are looking for a few counters to run the first pilots with. Tell us where you are."
            to="/contact-us"
            label="Ask about a pilot"
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Pricing;
