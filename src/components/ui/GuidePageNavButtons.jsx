import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';

function GuidePageNavButtons(props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: '1rem',
        // marginRight: '1rem',
      }}
    >
      <Button
        size={props.sm !== true ? 'medium' : 'small'}
        style={
          props.sm !== true
            ? {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.938rem',
                paddingRight: '1.938rem',
              }
            : {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.251rem',
                paddingRight: '1.251rem',
              }
        }
      >
        <Link to="/signup">Help</Link>
      </Button>
      <Button
        size={props.sm !== true ? 'medium' : 'small'}
        style={
          props.sm !== true
            ? {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.938rem',
                paddingRight: '1.938rem',
              }
            : {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.251rem',
                paddingRight: '1.251rem',
              }
        }
      >
        <Link to="/signup">Signup</Link>
      </Button>
      <Button
        size={props.sm !== true ? 'medium' : 'small'}
        style={
          props.sm !== true
            ? {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.938rem',
                paddingRight: '1.938rem',
              }
            : {
                fontWeight: 500,
                color: '#5C5C5C',
                paddingLeft: '1.251rem',
                paddingRight: '1.251rem',
              }
        }
      >
        <Link to="/login">Login</Link>
      </Button>
    </div>
  );
}

export default GuidePageNavButtons;
