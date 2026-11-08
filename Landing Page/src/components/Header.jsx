import React from "react";
import { AlignLeftOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import { Link } from "react-router-dom";
import logo from "../media/images/logo_new2.png";
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
          <Link to="/how-it-works" className="home-header-links">
            How it works
          </Link>
          <Link to="/pricing" className="home-header-links">
            Pricing
          </Link>
          <Link to="/open-build" className="home-header-links">
            Open build
          </Link>
          <Link to="/leadership" className="home-header-links">
            Our Team
          </Link>
          <Link to="/contact-us" className="home-header-links">
            Contact Us
          </Link>
          <a
            href="https://app.talk-motion.com/login"
            target="_blank"
            rel="noreferrer"
          >
            <Button size="large" shape="round" className="home-header-btn">
              Sign In
            </Button>
          </a>
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
                to="/how-it-works"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                How it works
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="/pricing"
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
                to="/open-build"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                Open build
              </Link>
            </li>
            <li style={{ listStyle: "none", marginBottom: "1rem" }}>
              <Link
                to="/leadership"
                className="drawer-links"
                style={{
                  textDecoration: "none",
                  color: "#000000",
                  fontSize: "1.1rem",
                }}
              >
                Our Team
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
              <a
                href="https://app.talk-motion.com/login"
                target="_blank"
                rel="noreferrer"
              >
                <Button size="middle" shape="round"
                style={{
                      textDecoration: "none",
                      color: "rgb(255 255 255)",
                      backgroundColor: "rgb(229 42 39)",
                    }}
                >
                  Sign In
                </Button>
              </a>
            </li>
          </ul>
        </Drawer>
      </div>
    </div>
  );
}

export default Header;
