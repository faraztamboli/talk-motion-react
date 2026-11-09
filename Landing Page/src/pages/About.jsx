import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { aboutPageDetails } from "../data/pageDetails";
import { Section, Cta, APP } from "../components/marketing/Sections";
import "../marketing.css";

function About(props) {
  const { title, description } = aboutPageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="About"
          title="It started with one boy who was not understood"
          lede="TalkMotion began when our founder, Faraz Tamboli, heard a story from his dad about a Deaf boy whose communication was not understood in a hearing environment. The gap was not in the boy. It was in the world around him."
        />

        <Section alt eyebrow="What we learned" title="The first version tried to translate signs. We changed course.">
          <div className="cols">
            <div>
              <h3>Where it started</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                As a student, Faraz built a prototype that tried to turn signs into speech, by teaching a computer each
                sign from recorded examples. It won recognition, including the Gloria Barron Prize for Young Heroes.
              </p>
            </div>
            <div>
              <h3>What we learned</h3>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                Computers cannot yet read sign language reliably from strangers, and stringing word clips together is not
                sign language. Most of all, a Deaf or non-speaking person must control what is said on their behalf.
              </p>
            </div>
          </div>
        </Section>

        <Section eyebrow="What TalkMotion is now" title="A conversation tool. You stay in control.">
          <ul className="list">
            <li>The hearing person speaks. You read live captions, in plain language if you want.</li>
            <li>You answer by typing or tapping a suggested reply, and edit anything.</li>
            <li>Nothing is spoken until you tap Speak, in a natural voice you choose.</li>
            <li>It does not replace interpreters, and it does not claim to read sign language.</li>
          </ul>
          <div className="btns" style={{ marginTop: 24 }}>
            <Link className="btn primary" to="/how-it-works">
              How it works
            </Link>
            <Link className="btn secondary" to="/open-build">
              Everything we claim
            </Link>
          </div>
        </Section>

        <Section alt eyebrow="Who builds it" title="A small team, building with AI, in the open">
          <p className="lede">
            We do not speak for the Deaf community, and we do not claim to. We publish every claim we make, ask Deaf,
            hard of hearing and non-speaking people to tell us what is wrong, and write down every month what we
            changed.
          </p>
          <div className="btns" style={{ marginTop: 24 }}>
            <Link className="btn secondary" to="/feedback?volunteer=1">
              Volunteer as a tester
            </Link>
            <Link className="btn secondary" to="/changelog">
              Read the changelog
            </Link>
          </div>
        </Section>

        <section className="tm-section">
          <Cta
            title="Try one conversation."
            body="Free for individuals. Open it on your phone and talk."
            href={`${APP}/signup`}
            label="Start free"
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

export default About;
