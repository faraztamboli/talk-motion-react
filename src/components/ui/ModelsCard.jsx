import React from "react";
import { Card, Avatar, Tooltip, Button } from "antd";
import { MdOutlineArrowRightAlt } from "react-icons/md";
// import {
//   EditOutlined,
//   AntDesignOutlined,
//   UserOutlined,
//   EllipsisOutlined,
//   SettingOutlined,
// } from '@ant-design/icons';
// const { Meta } = Card;

export const ModelsCard = (props) => {
  return (
    <Card bordered={false} className="models-card">
      <div>
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
      </div>

      <div className="card_content" style={{ marginTop: "1.5rem" }}>
        <h2 className="models-card-heading">Model Title</h2>
        <h3 className="models-card-description">Lorem ipsum dolor sit amet</h3>
      </div>

      <div className="trainer_div" style={{ marginTop: "1rem" }}>
        <h2 className="contributors-heading">Trainers</h2>
        <Avatar.Group>
          <Avatar src={"media/avatars/150-3.jpg"} />
          <Avatar
            style={{
              backgroundColor: "#f56a00",
            }}
            src={"media/avatars/150-2.jpg"}
          ></Avatar>
          <Tooltip title="Ant User" placement="top">
            <Avatar
              style={{
                backgroundColor: "#87d068",
              }}
              src={"media/avatars/150-26.jpg"}
            />
          </Tooltip>
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
