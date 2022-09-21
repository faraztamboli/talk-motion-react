import { Select } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import React from 'react';
import { voicesList } from '../../data';

const { Option } = Select;

export const VoicesDropdown = () => {
  const handleChange = value => {
    console.log(value);
  };

  return (
    <div className="select add-on">
      <span className="select-add-on">
        <SoundOutlined />
      </span>
      <Select
        defaultValue={voicesList[0].label}
        style={{
          width: 'calc(100% - 30px)',
        }}
        onChange={handleChange}
      >
        {voicesList.map((model, index) => (
          <Option key={index} value={model.value}>
            {model.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};
