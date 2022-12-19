import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import React from "react";
// import { modelsList } from "../../data";
import useModels from "../../hooks/useModels";
import { useState } from "react";
import { useEffect } from "react";

const { Option } = Select;

export const ModelsDropdown = (props) => {
  const { userModels } = useModels();
  // const [selectedModal, setSelectedModal] = useState();

  const handleChange = (value) => {
    // setSelectedModal(value); // here we can set a state to store the value of the select model component
    props.getModalId(value);
  };

  // useEffect(() => {
  //   console.log(selectedModal);
  // }, [selectedModal]);

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        // bordered="false"
        defaultValue={"Select Modal"}
        className="dropdowns"
        onChange={handleChange}
      >
        {userModels &&
          userModels.map((model) => (
            <Option key={model.id} value={model.id}>
              {model.title}
            </Option>
          ))}
      </Select>
    </div>
  );
};
