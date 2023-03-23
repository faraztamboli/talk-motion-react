import React, { useState, useEffect } from "react";
import { Card, Button, Dropdown, Avatar, Tooltip } from "antd";
import { MdOutlineArrowRightAlt, MdMoreVert } from "react-icons/md";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import UpdateClassroom from "../../components/ui/UpdateClassroom";
import plurkImg from "../../media/images/plurk.png";
import useProfile from "../../hooks/useProfile";

export const ClassroomCard = (props) => {
  const [userImg, setUserImg] = useState(null);
  const { getUserInfo } = useProfile();
  const { classroom, updateClassroom, setLoading } = props;

  useEffect(() => {
    getUserInfo(classroom.create_user)
      .then((res) => {
        console.log(res);
        setUserImg(res.sm_img);
      })
      .catch((err) => console.log(err));
  }, []);

  const items = [
    {
      key: "1",
      label: (
        <UpdateClassroom
          updateClassroom={updateClassroom}
          setLoading={setLoading}
        />
      ),
    },
  ];

  return (
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
          <img
            src={classroom.image ? classroom.image : plurkImg}
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
        <h2 className="models-card-heading">{classroom.name}</h2>
        <h3 className="models-card-description">{classroom.description}</h3>
      </div>

      <div className="trainer_div" style={{ marginTop: "1rem" }}>
        <Avatar.Group>
          <Tooltip title={classroom.create_user} placement="top">
            <Avatar src={userImg} icon={<UserOutlined />} />
          </Tooltip>
        </Avatar.Group>
      </div>

      <div
        className="card_btns flex align-items-center justify-content-end"
        style={{ marginTop: "1rem" }}
      >
        <Link to={`/video-subtitles/classrooms/${classroom.id}`}>
          <Button
            type="link"
            className="models-card-btn flex flex-center-center"
          >
            Enter <MdOutlineArrowRightAlt size={20} />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
