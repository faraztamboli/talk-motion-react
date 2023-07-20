import React from "react";
import { Card } from "antd";

import SubscriptionCard from "./SubscriptionCard";

function SubscriptionList(props) {
  const { purchaseList } = props;
  return (
    <Card title="Your Subscriptions">
      {purchaseList?.length < 1
        ? "No subcription!"
        : purchaseList?.map((subscription) => {
            return <SubscriptionCard subscription={subscription} />;
          })}
    </Card>
  );
}

export default SubscriptionList;
