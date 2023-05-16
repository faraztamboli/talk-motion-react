import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import useModels from "../../hooks/useModels";
import { useDispatch, useSelector } from "react-redux";
import { selectModel } from "../../app/features/modelSlice";
import JS2Py from "../../remotepyjs";
import useLocalStorage from "../../hooks/useLocalStorage";

const { Option } = Select;

export const ModelsDropdown = (props) => {
  const [models, setModels] = useState([]);
  const [defaultSelectedModelTitle, setDefaultSelectedModelTitle] = useState();
  const { getModelsUserCanTrain, getModel, getModelsUserCanUse } = useModels();
  const { modelId } = useSelector((state) => state.model);
  const [token] = useLocalStorage("token");

  const dispatch = useDispatch();

  useEffect(() => {
    getModel(modelId)
      .then((res) => {
        setDefaultSelectedModelTitle(res[0]?.title);
      })
      .catch((err) => console.log(err));
    props.from === "trainer" &&
      getModelsUserCanTrain("", 0, 999999)
        .then((res) => {
          setModels(res[0]);
        })
        .catch((err) => console.log(err));

    props.from === "converter" &&
      getModelsUserCanUse("", 0, 999999)
        .then((res) => {
          setModels(res[0]);
        })
        .catch((err) => console.log(err));
  }, []);

  const handleChange = (value) => {
    // load model here
    // loadModel2
      JS2Py.PythonFunctions.TalkMotionServer.loadModel2(
        token,
        value,
        function (res) {
            dispatch(setTrainingStatusOff());
        }
      );

    dispatch(selectModel(value));
    getModel(value)
      .then((res) => setDefaultSelectedModelTitle(res[0].title))
      .catch((err) => console.log(err));
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <AppstoreOutlined />
      </span>
      <Select
        defaultValue={
          defaultSelectedModelTitle ? defaultSelectedModelTitle : "Select Model"
        }
        value={defaultSelectedModelTitle}
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
