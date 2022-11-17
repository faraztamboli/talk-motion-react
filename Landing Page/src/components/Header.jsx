import React from "react";
import { AlignLeftOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import { Link } from "react-router-dom";
import logo from "../media/images/logo.png";
import logoSmall from "../media/images/logo-small.png";

function Header(props) {
  const [open, setOpen] = React.useState(false);

  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  return (
    <div className="home-header">
      <div className="container">
        <Link to="/">
          <div className="logo-div">
            <img
              src={props.md === true ? logoSmall : logo}
              style={props.md === true ? { width: "50px" } : { width: "180px" }}
              alt="TalkMotion"
            />
          </div>
        </Link>
        <div className="home-header-links-div">
          <Link to="/about" className="home-header-links">
            About
          </Link>
          <Link to="/guide" className="home-header-links">
            Features
          </Link>
          <a href="#pricing" className="home-header-links">
            Pricing
          </a>
          <Link to="/contact-us" className="home-header-links">
            Contact Us
          </Link>
          <Link to="/signup">
            <Button size="large" shape="round" className="home-header-btn">
              Signup for Free
            </Button>
          </Link>
        </div>

        <div className="hambarger-icon-div">
          <AlignLeftOutlined onClick={showDrawer} />
        </div>

        <Drawer
          title="TalkMotion"
          placement="right"
          className="drawer"
          onClose={onClose}
          open={open}
        >
          <ul>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="/about"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                About
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="/guide"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                Features
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="#pricing"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                Pricing
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="/contact-us"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                Contact Us
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Button size="middle" shape="round">
                Signup for Free
              </Button>
            </li>
          </ul>
        </Drawer>
      </div>
    </div>
  );
}

export default Header;
