import React from "react";
import UpdateModel from "../../components/ui/UpdateModel";
import { Card, Avatar, Tooltip, Button, Dropdown } from "antd";
import { MdOutlineArrowRightAlt, MdMoreVert } from "react-icons/md";
import NewTrainer from "../../components/ui/NewTrainer";
import plurkImg from "../../media/images/plurk.png";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";

export const ModelsCard = (props) => {
  const {
    model,
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
    loading,
    setLoading,
    showMessage,
  } = props;

  const items = [
    {
      key: "1",
      label: (
        <UpdateModel
          model_id={model.id}
          loading={loading}
          setLoading={setLoading}
          from="modelscard"
          showMessage={showMessage}
        />
      ),
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            setLoading(true);
            deleteModel(model.id)
              .then((res) => {
                showMessage("success", "Model deleted");
                console.log(res);
                setLoading(false);
              })
              .catch((err) => {
                showMessage("error", "Unable to delete the model");
                console.log(err);
                setLoading(false);
              });
          }}
        >
          Delete
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div
          style={{ width: "100%" }}
          onClick={() => cloneModel(model.id, model.is_public)}
        >
          Clone
        </div>
      ),
    },
    {
      key: "4",
      label: <div onClick={() => purchaseModel(model.id)}>Purchase</div>,
    },
  ];

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
              <Tooltip key={index} title={trainer.username} placement="top">
                <Avatar
                  src={trainer.sm_img ? trainer.sm_img : null}
                  icon={<UserOutlined />}
                />
              </Tooltip>
            );
          })}
          <NewTrainer id={model.id} addNewTrainer={addNewTrainer} />
        </Avatar.Group>
      </div>

      <div
        className="card_btns flex align-items-center justify-content-end"
        style={{ marginTop: "1rem" }}
      >
        <Link to={`/models/${model.id}`}>
          <Button
            type="link"
            className="models-card-btn flex flex-center-center"
          >
            Explore <MdOutlineArrowRightAlt size={20} />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
