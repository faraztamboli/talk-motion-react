import React from 'react';
import { Spin } from 'antd';

function Spinner(props) {
  return (
    <>
      <div
        style={
          props.pageSize === 'large'
            ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
              }
            : {
                width: 'auto',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
        }
      >
        <Spin size={props.size} />
      </div>
    </>
  );
}

export default Spinner;
