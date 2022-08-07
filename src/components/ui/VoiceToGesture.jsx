import React from "react";
import { Button } from "antd";

export const VoiceToGesture = () => {
  const loadings = () => {};
  const enterLoading = () => {};
  return (
    <div>
      <h2 className="mb-0">Voice To Gesture</h2>
      <p>View gestures from speech</p>
      <video src="" controls className="block w-100p mb-6"></video>
      <Button
        type="primary"
        loading={loadings[1]}
        onClick={() => enterLoading(1)}
      >
        Click me!
      </Button>
    </div>
  );
};
