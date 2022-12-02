import React from "react";
import UpdateModel from "../../components/ui/UpdateModel";
import { Card, Avatar, Tooltip, Button, Dropdown } from "antd";
import { MdOutlineArrowRightAlt, MdMoreVert } from "react-icons/md";
import NewTrainer from "../../components/ui/NewTrainer";
import useModels from "../../hooks/useModels";

export const ModelsCard = (props) => {
  const { deleteModel, cloneModel, purchaseModel } = useModels();
  const { model } = props;

  const items = [
    {
      key: "1",
      label: <UpdateModel model_id={model.model_id} />,
    },
    {
      key: "2",
      label: <div onClick={() => deleteModel(model.model_id)}>Delete</div>,
    },
    {
      key: "3",
      label: (
        <div
          style={{ width: "100%" }}
          onClick={() => cloneModel(model.model_id)}
        >
          Clone
        </div>
      ),
    },
    {
      key: "4",
      label: <div onClick={() => purchaseModel(model.model_id)}>Purchase</div>,
    },
  ];

  return (
    <Card bordered={false} className="models-card">
      <div className="flex" style={{ justifyContent: "space-between" }}>
        <div
          className="logo_div"
          style={{
            backgroundColor: "lightgray",
            display: "inline-block",
            padding: ".4rem",
          }}
        >
          <img
            src="https://talk-motion.com/public/images/svg/brand-logos/plurk.svg"
            alt="model logo"
            width={40}
          />
        </div>

        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
          <Button
            className="flex"
            style={{
              border: "none",
            }}
            size="large"
          >
            <MdMoreVert size={20} />
          </Button>
        </Dropdown>
      </div>

      <div className="card_content" style={{ marginTop: "1.5rem" }}>
        <h2 className="models-card-heading">{model.title}</h2>
        <h3 className="models-card-description">{model.description}</h3>
      </div>

      <div className="trainer_div" style={{ marginTop: "1rem" }}>
        <h2 className="contributors-heading">Trainers</h2>
        <Avatar.Group>
          {model.trainers.map((trainer, index) => {
            return (
              <Tooltip key={index} title={trainer.name} placement="top">
                <Avatar src={"media/avatars/150-26.jpg"} />
              </Tooltip>
            );
          })}
          <NewTrainer modelid={model.model_id} />
        </Avatar.Group>
      </div>

      <div
        className="card_btns flex align-items-center justify-content-end"
        style={{ marginTop: "1rem" }}
      >
        <Button type="link" className="models-card-btn flex flex-center-center">
          Explore <MdOutlineArrowRightAlt size={20} />
        </Button>
      </div>
    </Card>
  );
};
