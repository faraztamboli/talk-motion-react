import React, { useEffect } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Row, Col, Button, Badge } from "antd";
import { UserMenu } from "../ui/UserMenu";
import LanguageSelector from "../ui/LanguageSelector";
import usePayment from "../../hooks/usePayment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header = (props) => {
  const { getCart } = usePayment();
  const { cartCount } = useSelector((state) => state.cart);
  const { t } = useTranslation();

  useEffect(() => {
    getCart()
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }, []);

  const style = {
    padding: 0,
    position: "sticky",
    top: 0,
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
    <Layout.Header 
      className="site-layout-background" 
      style={{
        ...headerStyle,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderBottom: "1px solid var(--color-neutral-200)"
      }}
    >
      <Row
        className="pl-4 pr-5"
        type="flex"
        justify="space-between"
        align="middle"
        style={{ height: "100%" }}
      >
        <Col>
          {React.createElement(
            props.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => props.onCollapsed(),
              style: {
                fontSize: "18px",
                color: "var(--color-neutral-700)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                padding: "8px",
                borderRadius: "6px"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = "var(--color-neutral-100)";
                e.currentTarget.style.color = "var(--color-primary)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-neutral-700)";
              }
            }
          )}
        </Col>
        <Col className="flex flex-center-center" style={{ gap: "16px" }}>
          <LanguageSelector size="default" />
          <div>
            <Badge 
              count={cartCount} 
              size="small"
              style={{ 
                fontSize: "12px",
                minWidth: "18px",
                height: "18px",
                lineHeight: "18px"
              }}
            >
              <Link to="/cart">
                <Button 
                  type="primary" 
                  style={{
                    borderRadius: "6px",
                    height: "36px",
                    padding: "0 20px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 4px rgba(22, 119, 255, 0.2)",
                    transition: "all 0.2s ease-in-out"
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
                  <span>{t("header.cart")}</span>
                  {cartCount > 0 && (
                    <span style={{ 
                      fontSize: "12px",
                      opacity: 0.9
                    }}>
                      ({cartCount})
                    </span>
                  )}
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
