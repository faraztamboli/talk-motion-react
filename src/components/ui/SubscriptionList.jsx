import React from "react";
import { Card, Row, Col, Space, Button } from "antd";
import thumbnail from "../../media/images/unsplash_PddcoUGPBMw.png";

export default function SubscriptionList() {
  return (
    <div>
      <Card title="Your Subscriptions">
        <Card
          type="inner"
          title={
            <Row gutter={16}>
              <Col span="6">
                <Space direction="vertical">
                  ORDER PLACED
                  <span>12/12/23</span>
                </Space>
              </Col>
              <Col span="4">
                <Space direction="vertical">
                  Total
                  <span>$123.45</span>
                </Space>
              </Col>
              <Col span="4">
                <Space direction="vertical">
                  Shipped to
                  <a href="#!">Farukh</a>
                </Space>
              </Col>
            </Row>
          }
          extra={
            <>
              <p>Order #: 123 4567a 123 12</p>
              <Space>
                <a href="">View order details</a> -
                <a href="">View invoice</a>
              </Space>
            </>
          }
        >
          <Row gutter="16" justify="space-between" align="middle">
            <Col span="16">
              <Space align="top">
                <img
                  src={thumbnail}
                  alt=""
                  style={{
                    width: "80px",
                    height: "110px",
                    objectFit: "cover",
                  }}
                />
                <Space direction="vertical">
                  <h3 style={{ margin: 0 }}>
                    This is the model title
                  </h3>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing
                    elit. Rerum aliquam molestias facere est iusto
                    temporibus, unde, commodi atque iste fugiat error
                    soluta veniam necessitatibus consectetur pariatur
                    totam? Sint, porro? Molestias?
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
      </Card>
    </div>
  );
}
