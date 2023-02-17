import React, { useState } from "react";
import {
  Card,
  Avatar,
  Tooltip,
  Button,
  Dropdown,
  Space,
  InputNumber,
  Badge,
} from "antd";
import { MdOutlineArrowRightAlt, MdMoreVert } from "react-icons/md";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import UpdateModel from "../../components/ui/UpdateModel";
import NewTrainer from "../../components/ui/NewTrainer";
import ModelPrice from "../../components/ui/ModelPrice";
import plurkImg from "../../media/images/plurk.png";

export const ModelsCard = (props) => {
  const [quantity, setQuantity] = useState(1);
  const {
    model,
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
    addOrRemoveCartProduct,
    loading,
    setLoading,
    showMessage,
  } = props;

  const handleAddToCart = () => {
    addOrRemoveCartProduct(model.product_id, quantity)
      .then((res) => {
        console.log(res);
        showMessage("success", "Added to cart");
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "unable to add the model to the cart");
      });
  };

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

    {
      key: "5",
      label: <ModelPrice model_id={model.id} />,
    },
  ];

  return (
    <Badge.Ribbon
      text={
        model?.badge.includes("purchased")
          ? model?.recurring
            ? `$${model?.price}/${JSON.parse(model?.recurring)?.interval}`
            : model?.badge
          : model?.badge
      }
      color={model?.badge === "purchased" ? "purple" : "green"}
    >
      <Card
        bordered={false}
        className="models-card"
        style={{ minWidth: 200, height: "100%" }}
      >
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

          <Dropdown
            menu={{ items }}
            placement="bottomRight"
            trigger={["click"]}
          >
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

        {window.location.pathname == "/models" && (
          <Space className="mt-4">
            <InputNumber
              min={1}
              defaultValue={1}
              onChange={(value) => setQuantity(value)}
            />
            <Button type="primary" onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </Space>
        )}

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
    </Badge.Ribbon>
  );
};
