import React from 'react';
import { AlignLeftOutlined } from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import { Link } from 'react-router-dom';

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
        <div className="logo-div">
          <img
            src={props.md === true ? '/favicon.png' : '/logo.png'}
            style={props.md === true ? { width: '50px' } : { width: '180px' }}
            alt="TalkMotion"
          />
        </div>
        <div className="home-header-links-div">
          <a href="#about" className="home-header-links">
            About
          </a>
          <a href="#features" className="home-header-links">
            Features
          </a>
          <a href="#pricing" className="home-header-links">
            Pricing
          </a>
          <a href="#contact" className="home-header-links">
            Contact Us
          </a>
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
            <li style={{ listStyle: 'none', marginBottom: '1rem' }}>
              <Link
                to="/login"
                className="drawer-links"
                style={{ textDecoration: 'none', color: '#000000', fontSize: '1.1rem' }}
              >
                About
              </Link>
            </li>
            <li style={{ listStyle: 'none', marginBottom: '1rem' }}>
              <Link
                to="/login"
                className="drawer-links"
                style={{ textDecoration: 'none', color: '#000000', fontSize: '1.1rem' }}
              >
                Features
              </Link>
            </li>
            <li style={{ listStyle: 'none', marginBottom: '1rem' }}>
              <Link
                to="/login"
                className="drawer-links"
                style={{ textDecoration: 'none', color: '#000000', fontSize: '1.1rem' }}
              >
                Pricing
              </Link>
            </li>
            <li style={{ listStyle: 'none', marginBottom: '1rem' }}>
              <Link
                to="/login"
                className="drawer-links"
                style={{ textDecoration: 'none', color: '#000000', fontSize: '1.1rem' }}
              >
                Contact Us
              </Link>
            </li>
            <li style={{ listStyle: 'none', marginBottom: '1rem' }}>
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
