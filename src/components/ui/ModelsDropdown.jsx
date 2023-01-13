import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import useModels from "../../hooks/useModels";
import { useDispatch } from "react-redux";
import { selectModel } from "../../app/features/modelSlice";

const { Option } = Select;

export const ModelsDropdown = (props) => {
  const [models, setModels] = useState([]);
  const { getModelsUserCanTrain, getModelsUserCanUse } = useModels();
  const dispatch = useDispatch();

  useEffect(() => {
    props.from === "trainer" &&
      getModelsUserCanTrain()
        .then((res) => {
          console.log(res);
          setModels(res[0]);
        })
        .catch((err) => console.log(err));

    props.from === "converter" &&
      getModelsUserCanUse()
        .then((res) => {
          console.log(res);
          setModels(res[0]);
        })
        .catch((err) => console.log(err));
  }, []);

  const handleChange = (value) => {
    dispatch(selectModel(value));
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        defaultValue={models[0]?.id}
        className="dropdowns"
        onChange={handleChange}
      >
        {models?.length !== undefined &&
          models.map((model) => (
            <Option key={model.id} value={model.id}>
              {model.title}
            </Option>
          ))}
      </Select>
    </div>
  );
};
