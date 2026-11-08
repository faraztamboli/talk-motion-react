import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StoriesSection from "../components/StoriesSection";
import { homePageDetails } from "../data/pageDetails";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { Hero, Section, Steps, YourPart, Wedges, Cta, APP } from "../components/marketing/Sections";
import "../marketing.css";

function Home(props) {
  const { title, description } = homePageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />

      <Header md={props.md} />

      <main className="tm">
        <Hero />

        <Section
          id="how-it-works"
          alt
          eyebrow="How it works"
          title="How a conversation works"
          lede="Four steps, in the order they happen. The third one is the promise."
        >
          <Steps />
        </Section>

        <Section eyebrow="Who it is for" title="Two moments we built for first">
          <Wedges />
        </Section>

        <Section alt eyebrow="Your part, our part" title="You talk. The tool waits for you.">
          <YourPart />
        </Section>

        <section className="tm-section">
          <Cta
            title="Nothing is said for you until you say so."
            body="Free for individuals. Open it on your phone, share the code, and talk."
            href={`${APP}/signup`}
            label="Try a conversation, free"
          />
        </section>
      </main>

      <StoriesSection />

      <Footer />
    </>
  );
}

export default Home;
