import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import React from "react";
import { modelsList } from "../../data";

const { Option } = Select;

export const ModelsDropdown = () => {
  // const handleChange = e => e => {
  //   console.log(e.target.value);
  // };
  const handleChange = (value) => {
    console.log(value); // here we can set a state to store the value of the select model component
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        // bordered="false"
        defaultValue={modelsList[0].label}
        className="dropdowns"
        onChange={handleChange}
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
