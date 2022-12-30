import React from "react";
import TalkMotionImg from "../media/images/talk-motion.png";

function GuidePageVideo(props) {
  const style = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    margin: "0 4rem 0 0rem",
  };
  const divStyle =
    props.lg !== true
      ? style
      : { ...style, alignItems: "flex-start", margin: "0 0rem 0 0rem" };

  const h2InitialStyle = {
    fontSize: "3rem",
    fontWeight: "700",
    lineHeight: "3.516rem",
  };

  const h2Style =
    props.lg !== true
      ? h2InitialStyle
      : {
          ...h2InitialStyle,
          marginTop: "2rem",
          fontSize: "2rem",
          lineHeight: "2.891rem",
        };

  return (
    <div style={divStyle}>
      <h2 style={h2Style}>
        Easy gesture to voice and voice to gesture converter.
      </h2>
      <img
        src={TalkMotionImg}
        alt="Talk Motion"
        className="w-100p"
        style={{ height: "15.125rem" }}
      ></img>
    </div>
  );
}

export default GuidePageVideo;
