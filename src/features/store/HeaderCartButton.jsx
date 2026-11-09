import React from "react";
import { Link } from "react-router-dom";
import { Badge, Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useGetMyCartQuery } from "./storeApi";

/** Cart button for the header: the count comes from the server-side cart. */
export default function HeaderCartButton() {
  const { t } = useTranslation();
  const signedIn = useSelector((s) => s.login.isLoggedIn);
  const { data } = useGetMyCartQuery(undefined, { skip: !signedIn });
  const count = data?.count || 0;
  return (
    <Badge count={count} size="small">
      <Link to="/store/cart">
        <Button type="primary" icon={<ShoppingCartOutlined />} aria-label={t("header.cartCount", "Cart, {{count}} items", { count })}>
          {t("header.cart", "Cart")}
        </Button>
      </Link>
    </Badge>
  );
}
