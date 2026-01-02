import React, { useState, useEffect } from "react";
import { Select, List, Spin } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import useModels from "../../hooks/useModels";
import { useDispatch, useSelector } from "react-redux";
import { selectModel } from "../../app/features/modelSlice";
import JS2Py from "../../remotepyjs";
import useLocalStorage from "../../hooks/useLocalStorage";
import {
  setTrainingStatusOff,
  setTrainingStatusOn,
} from "../../app/features/trainerSlice";

const { Option } = Select;

export const ModelsDropdown = (props) => {
  const [models, setModels] = useState([]);
  const [concepts, setConcepts] = useState([]); // ← store model concepts
  const [defaultSelectedModelTitle, setDefaultSelectedModelTitle] = useState();
  const [loading, setLoading] = useState(false);
  const { getModelsUserCanTrain, getModel, getModelsUserCanUse, getModelConcepts } = useModels();
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
            if (!modelId && res[0]?.length > 0) {
              const firstModel = res[0][0];
              setDefaultSelectedModelTitle(firstModel.title);
              dispatch(selectModel(firstModel.id));
            }
        })
        .catch((err) => console.log(err));

    const id = Number(modelId) || 121;
    setLoading(true);
    getModelConcepts(id)
      .then((res) => {
        setConcepts(res.slice(0, 10)); // show first 10 concepts
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading concepts:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (value) => {
    // load model here
    // loadModel2
      JS2Py.PythonFunctions.TalkMotionServer.loadModel2(
        value,
        function (res) {
            dispatch(setTrainingStatusOff());
        }
      );

    dispatch(selectModel(value));
    setLoading(true);

    getModel(value)
      .then((res) => setDefaultSelectedModelTitle(res[0].title))
      .catch((err) => console.log(err));


    // fetch model concepts
    getModelConcepts(value)
      .then((res) => {
        setConcepts(res.slice(0, 10)); // only first 10
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  return (
<div
  className="select add-on"
  style={{ display: "flex", alignItems: "center", gap: 8 }}
>
  <span className="select-add-on">
    <AppstoreOutlined />
  </span>

  {/* Column wrapper: Select on top, concepts just below */}
  <div style={{ flex: 1, minWidth: 0 }}>
    <Select
      value={modelId ?? undefined}
      placeholder="Select Model"
      className="dropdowns"
      onChange={handleChange}
      options={models.map(m => ({ value: m.id, label: m.title }))}
      style={{ width: "100%" }}
    />

    {/* Concepts directly under the Select */}
    {concepts?.length > 0 && (
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",     // <-- horizontal, then wrap to next line
          gap: 10,
          width: "100%",
        }}
      >
        {concepts.map(c => (
          <div
            key={c.concept}
            style={{
              flex: "0 0 auto",  // <-- don't stretch; stay horizontal
              background: "rgba(8,22,95,0.05)",
              borderRadius: 8,
              padding: "8px 12px",
              minWidth: 120,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            <strong>{c.concept}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>
              {c.sample_count} samples
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
  );
};
