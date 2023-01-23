import React from "react";
import { Button, Card, Popconfirm } from "antd";
import plurkImg from "../../media/images/plurk.png";
import capitalize from "../../utils/capitalizeWord";
import { MdDelete, MdOutlineArrowRightAlt } from "react-icons/md";
import { Link } from "react-router-dom";

function ConceptCard(props) {
  const {
    concept,
    sample_count,
    which_hand,
    sample_recording_time,
    concept_quality,
    handleDeleteConcept,
  } = props;

  const date = new Date(sample_recording_time);
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return (
    <Card bordered={false} className="models-card" style={{ minWidth: 200 }}>
      <div className="flex flex-between-center">
        <div className="card-logo">
          <img src={plurkImg} alt="model logo" width={40} />
        </div>

        <div className="concept-card-delete-icon">
          <Popconfirm
            title="Are you sure to delete this concept?"
            onConfirm={() => handleDeleteConcept(concept)}
          >
            <MdDelete size={18} />
          </Popconfirm>
        </div>
      </div>

      <div className="card_content" style={{ marginTop: "1.5rem" }}>
        <h2 className="models-card-heading">{capitalize(concept)}</h2>
        <h3 className="models-card-description">{`Samples : ${sample_count}`}</h3>
        <h3 className="models-card-description">{`Hand : ${
          which_hand == 1
            ? "Left"
            : which_hand == 2
            ? "Right"
            : which_hand == 3
            ? "Both"
            : "None"
        }`}</h3>
        <h3 className="models-card-description">{`Recording Time : ${minutes}:${seconds}`}</h3>
        <h3 className="models-card-description">{`Quality: ${(
          100 - concept_quality
        ).toFixed(1)}%`}</h3>
      </div>

      <div
        className="flex align-items-center justify-content-end"
        style={{ marginTop: "1rem" }}
      >
        <video width="267" height="200" controls>
          <source src={`${props.video_url}`} type="video/mp4" />
          <source src="movie.ogg" type="video/ogg" />
        Your browser does not support the video tag.
        </video>
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
