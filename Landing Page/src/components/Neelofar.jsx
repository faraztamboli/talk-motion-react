import React from "react";
import { AlignLeftOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import modelImg from "../media/images/model.png";

function Neelofar(props) {
  return (
    <div className="payment-container">

      <div className="container">
        <img
          src="https://video.talk-motion.com/profile/neelofar/neelofar_sm.png"
          style={props.md === true ? { width: "50px" } : { width: "180px" }}
          alt="Neelofar Tamboli"
        />
        <h2>Neelofar Tamboli</h2>
        <p className="title">CoFounder, Chief Product Officer</p>
        <p>Neelofar has worked on various medical device startup initiatives. She heads the communications and product development for TalkMotion. She has a passion for ethics and equality. </p>
        <p>
                <a
                  href="https://www.linkedin.com/in/neelofar-tamboli-195366149"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    shape="round"
                    size={props.md === true ? "middle" : "large"}
                    ghost
                    className="hero-section-btns"
                  >
                    Linked In
                  </Button>
                </a>
        </p>
      </div>
    </div>
  );
}

export default Neelofar;
