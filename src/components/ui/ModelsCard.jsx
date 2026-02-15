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
import useModels from "../../hooks/useModels";
import { handleKeyboardClick } from "../../utils/accessibility";

export const ModelsCard = (props) => {
  const [quantity, setQuantity] = useState(1);
  const { getProductForFree } = useModels();
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

  //const { getProductForFree } = useModels();

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

  const handleGetModel = () => {
    console.log("getProductForFree called: ModelsCard.jsx");
    getProductForFree(model.product_id)
      .then((res) => {})
      .catch((err) => {
        showMessage("error", "unable to add the model to cart");
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
        <button
          type="button"
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
          onKeyDown={(e) => handleKeyboardClick(() => {
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
          }, e)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            color: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
          }}
          aria-label="Delete model"
        >
          Delete
        </button>
      ),
    },
    {
      key: "3",
      label: (
        <button
          type="button"
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", fontSize: "inherit", fontFamily: "inherit" }}
          onClick={() => cloneModel(model.id, model.is_public)}
          onKeyDown={(e) => handleKeyboardClick(() => cloneModel(model.id, model.is_public), e)}
          aria-label="Clone model"
        >
          Clone
        </button>
      ),
    },
    {
      key: "4",
      label: (
        <button
          type="button"
          onClick={() => purchaseModel(model.id)}
          onKeyDown={(e) => handleKeyboardClick(() => purchaseModel(model.id), e)}
          style={{ background: "none", border: "none", padding: 0, width: "100%", textAlign: "left", cursor: "pointer", color: "inherit", fontSize: "inherit", fontFamily: "inherit" }}
          aria-label="Purchase model"
        >
          Purchase
        </button>
      ),
    },

    {
      key: "5",
      label: (
        <ModelPrice
          model_id={model.id}
          product_id={model.product_id}
        />
      ),
    },
  ];

  return (
    <Badge.Ribbon
      text={model?.badge}
      color={model?.badge === "purchased" ? "green" : "purple"}
    >
      <Card
        bordered={false}
        className="models-card"
        style={{ minWidth: 200, height: "100%" }}
      >
        <div
          className="flex"
          style={{ 
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            className="logo_div"
            style={{
              backgroundColor: "var(--color-neutral-200)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--spacing-sm)",
              borderRadius: "var(--radius-md)",
              transition: "all var(--transition-base)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-neutral-300)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-neutral-200)";
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
                boxShadow: "none",
                transition: "all var(--transition-base)"
              }}
              size="large"
              aria-label="Open model options menu"
              aria-haspopup="true"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-neutral-100)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <MdMoreVert size={20} aria-hidden="true" />
            </Button>
          </Dropdown>
        </div>

        <div className="card_content" style={{ marginTop: "1.5rem" }}>
          <h2 className="models-card-heading">{model.title}</h2>
          <h3 className="models-card-description">
            {model.description}
          </h3>
        </div>

        {model.price > 0 ? (
          <div>
            <h2>
              ${model.price / 100} /{" "}
              {model.recurring
                ? JSON.parse(model?.recurring).interval
                : "lifetime"}
            </h2>
          </div>
        ) : (
          <div>
            <h2>Free</h2>
          </div>
        )}

        <div className="trainer_div" style={{ marginTop: "1rem" }}>
          <h2 className="contributors-heading">Trainers</h2>
          <Avatar.Group>
            {model.trainers.map((trainer, index) => {
              return (
                <Tooltip
                  key={index}
                  title={trainer.username}
                  placement="top"
                >
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
          <Space className="mt-4" style={{ width: "100%" }}>
            {model?.badge === "purchased" ? (
              <div style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-success-light)",
                color: "var(--color-success)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                width: "100%"
              }}>
                ✓ You already purchased this model!
              </div>
            ) : model.price > 0 ? (
              <Button 
                type="primary" 
                onClick={handleAddToCart}
                block
                style={{
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  height: "40px",
                  boxShadow: "0 2px 4px rgba(22, 119, 255, 0.2)",
                  transition: "all var(--transition-base)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(22, 119, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(22, 119, 255, 0.2)";
                }}
              >
                Add to Cart
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleGetModel}
                block
                style={{
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  height: "40px",
                  boxShadow: "0 2px 4px rgba(22, 119, 255, 0.2)",
                  transition: "all var(--transition-base)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(22, 119, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(22, 119, 255, 0.2)";
                }}
              >
                Get for Free
              </Button>
            )}
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
              aria-label="Explore model details"
            >
              Explore <MdOutlineArrowRightAlt size={20} aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </Card>
    </Badge.Ribbon>
  );
};
