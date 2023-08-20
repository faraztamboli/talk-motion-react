import React from "react";
import { Card, Row, Col, Space, Button, Badge } from "antd";
import thumbnail from "../../media/images/unsplash_PddcoUGPBMw.png";

function SubscriptionCard({
  subscription,
  cancelSubscription,
  cancelProductSubscription,
  cancelSubscriptionItem,
}) {
  const {
    username,
    created,
    fullname,
    stripe_subscription_id,
    subscription_id,
    latest_invoice_currency,
    invoice_create_time,
    latest_invoice_subtotal,
    subscription_status,
    products,
    current_period_end,
  } = subscription;

  const handleProductUnsubscribe = (e, product_id) => {
    cancelProductSubscription(product_id)
      .then((res) => console.log("res", res))
      .catch((err) => console.log("err", err));
  };

  const handleUnsubscribe = (e, subscription_id_) => {
    cancelSubscription(subscription_id_)
      .then((res) => console.log("res", res))
      .catch((err) => console.log("err", err));
  };

  return (
    <>
      <Badge.Ribbon
        text={subscription_status}
        color={subscription_status !== "successs" ? "red" : "green"}
      >
        <Card
          key={stripe_subscription_id}
          type="inner"
          style={{
            marginBottom: "50px",
            paddingBottom: "25px",
            boxShadow: "0px 20px 30px -30px #aaa",
          }}
          title={
            <Row
              gutter={16}
              style={{
                paddingTop: "15px",
                paddingBottom: "15px",
              }}
            >
              <Col span="6">
                <Space direction="vertical">
                  <span>ORDER PLACED</span>
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
                <a href="">View invoice</a> -
                <a
                  href="#!"
                  onClick={(e) =>
                    handleUnsubscribe(e, subscription_id)
                  }
                >
                  Cancel Complete Subscription
                </a>
              </Space>
            </div>
          }
        >
          {products?.map((product) => (
            <Row
              gutter="16"
              justify="space-between"
              align="middle"
              style={{
                padding: "25px",
                marginBottom: "25px",
                border: "1px solid #eee",
                borderRadius: "9px",
                boxShadow: "0px 17px 20px -30px #aaa",
              }}
            >
              <Col span="16">
                <Space align="top">
                  {/* <img
                    src={thumbnail}
                    alt=""
                    style={{
                      width: "80px",
                      height: "110px",
                      objectFit: "cover",
                      marginRight: "20px",
                    }}
                  /> */}
                  <Space direction="vertical">
                    <h3 style={{ margin: 0 }}>
                      {product.description}
                    </h3>
                    <Space className="mySub-product-info-pills">
                      {product.latest_invoice_amount_due > 0 && (
                        <span>
                          Due Amount:{" "}
                          <strong>
                            ${product.latest_invoice_amount_due / 100}{" "}
                          </strong>
                        </span>
                      )}
                      <span>
                        Totla Amount:{" "}
                        <strong>${product.amount / 100}</strong>
                      </span>
                      <span>
                        <a
                          target="_blank"
                          href={product.hosted_invoice_url}
                        >
                          View Invoice
                        </a>
                      </span>
                    </Space>
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
                  <Button
                    type="text"
                    block
                    onClick={(e) =>
                      handleProductUnsubscribe(e, product.product_id)
                    }
                  >
                    Unsubscribe
                  </Button>
                </Space>
              </Col>
            </Row>
          ))}
        </Card>
      </Badge.Ribbon>
    </>
  );
}

export default SubscriptionCard;
