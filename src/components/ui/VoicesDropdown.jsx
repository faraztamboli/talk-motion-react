import { useState, useEffect } from "react";
import { Select } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import React from "react";
import { useDispatch } from "react-redux";
import { setVoice } from "../../app/features/speechSlice";

const { Option } = Select;

export const VoicesDropdown = () => {
  const speechsynthesis = window.speechSynthesis;
  const [voicesList, setVoiceList] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    setVoiceList(speechsynthesis.getVoices());
  }, []);

  const handleChange = (value) => {
    dispatch(setVoice(value));
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <SoundOutlined />
      </span>
      <Select
        defaultValue={"Microsoft David - English (United States)"}
        className="dropdowns"
        onChange={handleChange}
      >
        {voicesList?.map((model, index) => (
          <Option key={index} value={model.name}>
            {model.name}
          </Option>
        ))}
      </Select>
    </div>
  );
};
