import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import PricingSection from "../components/PricingSection";
import StoriesSection from "../components/StoriesSection";
import { homePageDetails } from "../data/pageDetails";
import MetaDecorator from "../components/HOCs/MetaDecorator";

function Home(props) {
  const { title, description } = homePageDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />

      <Header md={props.md} />

      <HeroSection md={props.md} />

      <AboutSection />

      <FeaturesSection />

      <PricingSection />

      <StoriesSection />

      <Footer />
    </>
  );
}

export default Home;
