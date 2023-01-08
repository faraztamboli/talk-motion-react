import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import React from "react";
import useModels from "../../hooks/useModels";
import { useDispatch } from "react-redux";
import { selectModel } from "../../app/features/modelSlice";

const { Option } = Select;

export const ModelsDropdown = () => {
  const { userModels } = useModels();
  const dispatch = useDispatch();

  const handleChange = (value) => {
    dispatch(selectModel(value));
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        defaultValue={userModels[0]?.id}
        className="dropdowns"
        onChange={handleChange}
      >
        {userModels?.length !== undefined &&
          userModels.map((model) => (
            <Option key={model.id} value={model.id}>
              {model.title}
            </Option>
          ))}
      </Select>
    </div>
  );
};
