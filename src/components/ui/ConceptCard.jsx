import React from "react";
import { Button, Card } from "antd";
import plurkImg from "../../media/images/plurk.png";
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Link } from "react-router-dom";

function ConceptCard(props) {
  return (
    <Card bordered={false} className="models-card" style={{ minWidth: 200 }}>
      <div className="flex" style={{ justifyContent: "space-between" }}>
        <div
          className="logo_div"
          style={{
            backgroundColor: "lightgray",
            display: "inline-block",
            padding: ".4rem",
          }}
        >
          <img src={plurkImg} alt="model logo" width={40} />
        </div>
      </div>

      <div className="card_content" style={{ marginTop: "1.5rem" }}>
        <h2 className="models-card-heading">{props.concept}</h2>
        <h3 className="models-card-description">{`Frames : ${props.frames_count}`}</h3>
      </div>

      <div
        className="card_btns flex align-items-center justify-content-end"
        style={{ marginTop: "1rem" }}
      >
        <Link to={`${props.concept}`}>
          <Button
            type="link"
            className="models-card-btn flex flex-center-center"
          >
            Details <MdOutlineArrowRightAlt size={20} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default ConceptCard;
