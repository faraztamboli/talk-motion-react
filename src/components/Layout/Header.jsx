import React, { useEffect } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Row, Col, Button, Badge } from "antd";
import { UserMenu } from "../ui/UserMenu";
import usePayment from "../../hooks/usePayment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Header = (props) => {
  const { getCart } = usePayment();
  const { cartCount } = useSelector((state) => state.cart);

  useEffect(() => {
    getCart()
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }, []);

  const style = {
    padding: 0,
    position: "sticky",
    top: -2,
    zIndex: 1,
    width: "auto",
    marginLeft: props.collapsedWidth,
    transition: "all .10s ease-in-out",
  };

  const headerStyle = props.collapsed
    ? style
    : {
        ...style,
        marginLeft: props.sideBarWidth,
        transition: "all .30s ease-in-out",
      };

  return (
    <Layout.Header className="site-layout-background" style={headerStyle}>
      <Row
        className="pl-4 pr-5"
        type="flex"
        justify="space-between"
        align="middle"
      >
        <Col>
          {React.createElement(
            props.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => props.onCollapsed(),
            }
          )}
        </Col>
        <Col className="flex flex-center-center">
          <div className="mr-8">
            <Badge count={cartCount}>
              <Link to="/cart">
                <Button type="primary" className="px-5">
                  Cart
                </Button>
              </Link>
            </Badge>
          </div>
          <UserMenu />
        </Col>
      </Row>
    </Layout.Header>
  );
};

export default Header;
