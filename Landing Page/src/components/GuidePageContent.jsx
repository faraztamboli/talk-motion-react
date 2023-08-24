import React from "react";

function GuidePageContent(props) {
  const initialContentStyle = { marginLeft: "2rem", paddingTop: ".4rem" };
  const contentStyle =
    props.sm !== true
      ? initialContentStyle
      : { ...initialContentStyle, marginLeft: ".8rem", marginRight: "2rem" };

  return (
    <div style={props.lg === true ? { margin: "2rem 0 0 0rem" } : null}>
      <div className="con con-1">
        <div className="number">
          <p className="guide-page-number-circle">1</p>
        </div>
        <div className="content" style={contentStyle}>
          <h2 className="guide-page-content-h2">
            Sign language gestures to voice
          </h2>
          <p className="guide-page-content-p w-100p">
            Deaf and aphonic people can sign and their movements will be picked
            up by their webcam. An Artificial Intelligence algorithm
            will convert these gestures into voice.
          </p>
        </div>
      </div>

      <div className="con con-1">
        <div className="number">
          <p className="guide-page-number-circle">2</p>
        </div>
        <div className="content" style={contentStyle}>
          <h2 className="guide-page-content-h2">
            Voice to sign language gestures
          </h2>
          <p className="guide-page-content-p w-100p">
            A hearing person can verbally respond, and TalkMotion will display
            sign language pictures on the screen using voice recognition so that
            the Deaf or Aphonic person can understand what the hearing person is
            saying.
          </p>
        </div>
      </div>

      <div className="con con-1">
        <div className="number">
          <p className="guide-page-number-circle">3</p>
        </div>
        <div className="content" style={contentStyle}>
          <h2 className="guide-page-content-h2">
            Professional models for various settings
          </h2>
          <p className="guide-page-content-p w-100p">
            TalkMotion offers translation models for a wide range of applications.
            Whether you want to communicate in retail shops, healthcare settings,
            at workplace or talking to your loved ones, we have you covered!
            We are working with experts in ASL to map a wide range of gestures.
          </p>
        </div>
      </div>

      <div className="con con-1">
        <div className="number">
          <p className="guide-page-number-circle">4</p>
        </div>
        <div className="content" style={contentStyle}>
          <h2 className="guide-page-content-h2">
            Personalized models
          </h2>
          <p className="guide-page-content-p w-100p">
            TalkMotion uses the power of Artificial Intelligence to translate sign language to voice
            and voice to sign language. It allows you to create and train your own custom gestures.
            We are working with experts in ASL to map a wide range of gestures.
          </p>
        </div>
      </div>

      <div className="con con-1">
        <div className="number">
          <p className="guide-page-number-circle">5</p>
        </div>
        <div className="content" style={contentStyle}>
          <h2 className="guide-page-content-h2">
            TalkMotion in Education
          </h2>
          <p className="guide-page-content-p w-100p">
            TalkMotion makes educational video content available to the Deaf and aphonic community
            in their own native communication platform sign language. Students can learn the same
            as their hearing peers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GuidePageContent;
