import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import React from "react";
import { modelsList } from "../../data";

const { Option } = Select;

export const ModelsDropdown = () => {
  const handleChange = () => (e) => {
    console.log(e.target.value);
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        defaultValue={modelsList[0].label}
        style={{
          width: "calc(100% - 30px)",
        }}
        onChange={handleChange()}
      >
        {modelsList.map((model, index) => (
          <Option key={index} value={model.value}>
            {model.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};
