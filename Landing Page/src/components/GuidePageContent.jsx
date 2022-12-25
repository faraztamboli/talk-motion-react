import React from "react";

function GuidePageContent(props) {
  return (
    <div style={props.lg === true ? { margin: "2rem 0 0 0rem" } : null}>
      <div
        className="con con-1"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div className="number">
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "50px",
              height: "50px",
              border: "1px solid black",
              borderRadius: "50%",
              fontSize: "1.5rem",
              fontWeight: "700",
              backgroundColor: "white",
            }}
          >
            1
          </p>
        </div>
        <div
          className="content"
          style={
            props.sm !== true
              ? {
                  marginLeft: "2rem",
                  paddingTop: ".4rem",
                }
              : {
                  marginLeft: ".8rem",
                  marginRight: "2rem",
                  paddingTop: ".4rem",
                }
          }
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              lineHeight: "1.7rem",
              display: "inline-block",
            }}
          >
            Train the system to earn points
          </h2>
          <p
            style={
              props.sm !== true
                ? {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
                : {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
            }
          >
            TalkMotion uses the power of AI to translate sign language to voice
            and voice to sign language. It allows you to create and train your
            own custom gestures. We are working with experts in ASL to map a
            wide range of gestures.
          </p>
        </div>
      </div>
      <div
        className="con con-1"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div className="number">
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "50px",
              height: "50px",
              border: "1px solid black",
              borderRadius: "50%",
              fontSize: "1.5rem",
              fontWeight: "700",
              backgroundColor: "white",
            }}
          >
            2
          </p>
        </div>
        <div
          className="content"
          style={
            props.sm !== true
              ? {
                  marginLeft: "2rem",
                  paddingTop: ".4rem",
                }
              : {
                  marginLeft: ".8rem",
                  marginRight: "2rem",
                  paddingTop: ".4rem",
                }
          }
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              lineHeight: "1.7rem",
            }}
          >
            Convert your voice to gestures
          </h2>
          <p
            style={
              props.sm !== true
                ? {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
                : {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
            }
          >
            A hearing person can verbally respond, and TalkMotion will display
            sign language pictures on the screen using voice recognition so that
            the deaf or aphonic person can understand what the hearing person is
            saying.
          </p>
        </div>
      </div>
      <div
        className="con con-1"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div className="number">
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "50px",
              height: "50px",
              border: "1px solid black",
              borderRadius: "50%",
              fontSize: "1.5rem",
              fontWeight: "700",
              backgroundColor: "white",
            }}
          >
            3
          </p>
        </div>
        <div
          className="content"
          style={
            props.sm !== true
              ? {
                  marginLeft: "2rem",
                  paddingTop: ".4rem",
                }
              : {
                  marginLeft: ".8rem",
                  marginRight: "2rem",
                  paddingTop: ".4rem",
                }
          }
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              lineHeight: "1.7rem",
            }}
          >
            Convert your gestures to voice
          </h2>
          <p
            style={
              props.sm !== true
                ? {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
                : {
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    width: "100%",
                    marginTop: "1.313rem",
                  }
            }
          >
            Deaf and aphonic people can sign and their movements will be picked
            up by the gesture detector. An Artificial Intelligence algorithm
            will convert these gestures into voice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GuidePageContent;
