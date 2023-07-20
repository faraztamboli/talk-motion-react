import React from "react";
import { Card, Row, Col, Space, Button, Badge } from "antd";
import thumbnail from "../../media/images/unsplash_PddcoUGPBMw.png";

function SubscriptionCard({ subscription }) {
  const {
    username,
    created,
    fullname,
    stripe_subscription_id,
    latest_invoice_currency,
    invoice_create_time,
    latest_invoice_subtotal,
    subscription_status,
    latest_invoice_lines_data,
  } = subscription;
  const latest_invoice_lines_data_parsed = JSON.parse(
    latest_invoice_lines_data
  );
  const { amount, description, id, type } =
    latest_invoice_lines_data_parsed;
  console.log(latest_invoice_lines_data_parsed);
  return (
    <>
      <Badge.Ribbon
        text={subscription_status}
        color={subscription_status !== "successs" ? "red" : "green"}
      >
        <Card
          key={id}
          type="inner"
          title={
            <Row
              gutter={16}
              style={{ paddingTop: "15px", paddingBottom: "15px" }}
            >
              <Col span="6">
                <Space direction="vertical">
                  <span>
                    ORDER PLACED
                    {/* <Badge
                    count={subscription_status}
                    showZero
                    color={
                      subscription_status !== "successs"
                        ? "red"
                        : "green"
                    }
                  /> */}
                  </span>
                  <span>{invoice_create_time}</span>
                </Space>
              </Col>
              <Col span="4">
                <Space direction="vertical">
                  Total
                  <span>${latest_invoice_subtotal / 100}</span>
                </Space>
              </Col>
              <Col span="4">
                <Space direction="vertical">
                  Shipped to
                  <a href="#!">{fullname}</a>
                </Space>
              </Col>
            </Row>
          }
          extra={
            <div style={{ paddingTop: "20px" }}>
              <p>Order #: 123 4567a 123 12</p>
              <Space>
                <a href="">View order details</a> -
                <a href="">View invoice</a>
              </Space>
            </div>
          }
        >
          <Row
            gutter="16"
            justify="space-between"
            align="middle"
            style={{ paddingTop: "40px", paddingBottom: "30px" }}
          >
            <Col span="16">
              <Space align="top">
                <img
                  src={thumbnail}
                  alt=""
                  style={{
                    width: "80px",
                    height: "110px",
                    objectFit: "cover",
                    marginRight: "20px",
                  }}
                />
                <Space direction="vertical">
                  <h3 style={{ margin: 0 }}>{description}</h3>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing
                    elit. Odit perferendis beatae modi vitae nisi,
                    dolores accusantium ab reiciendis voluptatem
                    voluptate sapiente maiores eligendi ratione, totam
                    laborum esse harum fuga labore!
                  </p>
                </Space>
              </Space>
            </Col>
            <Col span="5">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" dashed block>
                  Leave a review
                </Button>
                <Button type="link" block>
                  Problem with the order!
                </Button>
                <Button type="text" block>
                  Unsubscribe
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Badge.Ribbon>
    </>
  );
}

export default SubscriptionCard;
