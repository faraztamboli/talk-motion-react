import React, { useState, useEffect } from "react";
import { Descriptions } from "antd";
import UpdateProfile from "../components/ui/UpdateProfile";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import useMySubscriptions from "../hooks/useMySubscriptions";

function MySubscriptions(props) {
  const [purchaseList, setPurchaseList] = useState();
  const { getPurchaseList, getPurchaseDetail } = useMySubscriptions();

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
        <div>
          <UserMenuProfileItem size="large" />
        </div>
        <div
          className="details_section"
          style={{ marginTop: "2rem" }}
        >
          <Descriptions
            layout="horizontal"
            column={1}
            bordered
            labelStyle={{ backgroundColor: "whitesmoke" }}
          >
            <Descriptions.Item label="Username">
              {"xyz"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </>
  );
}

export default MySubscriptions;
