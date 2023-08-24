import React from "react";
import { AlignLeftOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import modelImg from "../media/images/model.png";

function Faraz(props) {
  return (
    <div className="payment-container">
      <div className="container">
        <img
          src="https://video.talk-motion.com/profile/faraz/faraz_sm.png"
          style={props.md === true ? { width: "50px" } : { width: "180px" }}
          alt="Faraz Tamboli"
        />
        <h2>Faraz Tamboli</h2>
        <p className="title">Founder, Chief Executive Officer</p>
        <p>Faraz invented TalkMotion. He has won numerous awards and scholarships. He is committed to delivering TalkMotion to millions in Deaf and hard of hearing community.</p>
        <p>
                <a
                  href="https://www.linkedin.com/in/faraz-tamboli-6b0896233"
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

export default Faraz;
