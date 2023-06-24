import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Avatar,
  Button,
  List,
  Skeleton,
} from "antd";
import UpdateProfile from "../components/ui/UpdateProfile";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import useMySubscriptions from "../hooks/useMySubscriptions";

function MySubscriptions(props) {
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [list, setList] = useState([]);
  const [purchaseList, setPurchaseList] = useState();
  const { getPurchaseList, getPurchaseDetail } = useMySubscriptions();
  const dumyData = [
    {
      title: "Ant Design Title 1",
    },
    {
      title: "Ant Design Title 2",
    },
    {
      title: "Ant Design Title 3",
    },
    {
      title: "Ant Design Title 4",
    },
  ];

  useEffect(() => {
    getPurchaseList()
      .then((res) => {
        console.log(
          "purchaseList",
          JSON.parse(res[4].stripe_subscription_json)
        );
        setPurchaseList(res);
      })
      .catch((err) => console.log(err));
  }, []);

  const style =
    props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };

  return (
    <>
      <div style={style} className="layout-bg mh-100vh">
        <div
          className="details_section"
          style={{ marginTop: "2rem" }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Card title="Recuring Charges" bordered={false}>
                <Space
                  size="middle"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Module <strong>123.12</strong>
                </Space>
                <Space
                  size="middle"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Module <strong>123.12</strong>
                </Space>
                <Space
                  size="middle"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Module <strong>123.12</strong>
                </Space>

                <hr />
                <Space
                  size="middle"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <strong>Total:</strong>
                  <strong>345</strong>
                </Space>
              </Card>
            </Col>
          </Row>
          <br />
          <Row gutter={16}>
            <Col span={8}>
              <Card title="List of subscriptions" bordered={false}>
                <List
                  itemLayout="horizontal"
                  dataSource={dumyData}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`}
                          />
                        }
                        title={
                          <a href="https://ant.design">
                            {item.title}
                          </a>
                        }
                        description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                      />
                      <Button type="primary" danger>
                        Unsubscribe
                      </Button>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default MySubscriptions;
