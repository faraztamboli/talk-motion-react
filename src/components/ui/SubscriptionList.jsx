import React from "react";
import { Card } from "antd";

import SubscriptionCard from "./SubscriptionCard";

function SubscriptionList(props) {
  const {
    purchaseList,
    cancelSubscription,
    cancelProductSubscription,
    cancelSubscriptionItem,
  } = props;
  return (
    <Card title="Your Subscriptions">
      {purchaseList?.length < 1
        ? "No subcription!"
        : purchaseList?.map((subscription) => {
            return (
              <SubscriptionCard
                subscription={subscription}
                cancelSubscription={cancelSubscription}
                cancelProductSubscription={cancelProductSubscription}
                cancelSubscriptionItem={cancelSubscriptionItem}
                key={subscription.payment_intent_client_secret}
              />
            );
          })}
    </Card>
  );
}

export default SubscriptionList;
