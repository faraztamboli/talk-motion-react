import React from "react";
import { pageContent } from "../data/appContent";

function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-content">
          <div className="about-heading">
            <h3>About us</h3>
          </div>
          <div className="about-para">{pageContent.aboutPageContent}</div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
