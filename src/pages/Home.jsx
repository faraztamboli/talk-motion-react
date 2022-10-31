import React from 'react';
import Header from '../components/Layout/home/Header';
import Footer from '../components/Layout/home/Footer';
import HeroSection from '../components/Layout/home/HeroSection';
import AboutSection from '../components/Layout/home/AboutSection';
import FeaturesSection from '../components/Layout/home/FeaturesSection';
import PricingSection from '../components/Layout/home/PricingSection';
import StoriesSection from '../components/Layout/home/StoriesSection';

function Home(props) {
  return (
    <>
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
