import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { howItWorksPageDetails } from "../data/pageDetails";
import { Section, Steps, YourPart, VenueTimeline, Cta, APP } from "../components/marketing/Sections";
import "../marketing.css";

function HowItWorks(props) {
  const { title, description } = howItWorksPageDetails;
  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="How it works"
          title="How a conversation works"
          lede="Four steps, in the order they happen. The third one is the promise: nothing is spoken until you confirm it."
        >
          <Steps />
        </Section>

        <Section alt eyebrow="Your part, our part" title="You stay in the conversation. The tool does the waiting.">
          <YourPart />
        </Section>

        <Section
          eyebrow="For pharmacies and clinics"
          title="A counter you can set up in an afternoon"
          lede="A tablet at the counter, staff trained in twenty minutes, and a Deaf customer served without waiting for an interpreter."
          note="Pilot programme for pharmacies opening soon. Ask us through the contact page."
        >
          <VenueTimeline />
        </Section>

        <Section
          eyebrow="What it does not do"
          title="Honest limits"
          lede="We would rather you know now than find out at the counter."
        >
          <ul className="list">
            <li>
              <strong>It does not replace interpreters.</strong> For medical, legal and financial conversations, book one.
              TalkMotion covers the moments when none is available.
            </li>
            <li>
              <strong>It does not read continuous signing.</strong> Today you answer by typing or tapping a suggested reply.
              Sign recognition will arrive as a draft you confirm, only after Deaf users have tested it.
            </li>
            <li>
              <strong>Your own cloned voice is not here yet.</strong> You choose from natural voices now. Cloning will
              need your recorded consent.
            </li>
            <li>
              <strong>Captions can be wrong.</strong> When they are, ask the person to repeat. Nothing is spoken for you
              without your tap, so a wrong caption never becomes a wrong answer.
            </li>
          </ul>
        </Section>

        <section className="tm-section">
          <Cta
            title="Try one conversation."
            body="Free for individuals. Open it on your phone, share the code with the person in front of you, and talk."
            href={`${APP}/signup`}
            label="Start free"
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

export default HowItWorks;
