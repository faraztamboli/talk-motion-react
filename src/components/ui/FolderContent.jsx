import React from "react";
import { Empty } from "antd";

function FolderContent({ content }) {
  return content.constructor == Array && content.length > 0 ? (
    content.map((item, index) => {
      return <div key={index}>hello</div>;
    })
  ) : (
    <Empty />
  );
}

export default FolderContent;
