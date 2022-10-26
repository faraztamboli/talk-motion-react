import React from 'react';
import { Card, Avatar, Divider, Tooltip, Button } from 'antd';
// import {
//   EditOutlined,
//   AntDesignOutlined,
//   UserOutlined,
//   EllipsisOutlined,
//   SettingOutlined,
// } from '@ant-design/icons';
// const { Meta } = Card;

export const ModelsCard = props => {
  return (
    <Card
      bordered={false}
      // hoverable={true}
      style={{ backgroundColor: '#eef1ee', borderRadius: '9px' }}
    >
      <div
        style={
          props.collapsedWidth !== 0
            ? {
                display: 'flex',
                width: '15.3rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }
            : {
                display: 'flex',
                width: '10.3rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }
        }
      >
        <div
          className="logo_div"
          style={{ backgroundColor: 'lightgray', display: 'inline-block', padding: '.4rem' }}
        >
          <img
            src="https://talk-motion.com/public/images/svg/brand-logos/plurk.svg"
            alt="model logo"
            width={40}
          />
        </div>
        <div className="badge_div">
          <p
            className="badge"
            style={{
              backgroundColor: '#50cd89',
              color: 'white',
              fontSize: 'small',
              // marginLeft: '.4rem ',
              padding: '3px 4px',
              verticalAlign: 'top',
              borderRadius: '10px',
            }}
          >
            completed
          </p>
        </div>
      </div>

      <div className="card_content" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0', fontWeight: 'bold' }}>Model Title</h2>
        <h3 style={{ color: '#b5b5c3', margin: '0' }}>This is model description</h3>
      </div>

      <div className="trainer_div" style={{ marginTop: '1rem' }}>
        <h2 style={{ margin: '0' }}>Trainers</h2>
        <Avatar.Group>
          <Avatar src={'media/avatars/150-3.jpg'} />
          <Avatar
            style={{
              backgroundColor: '#f56a00',
            }}
            src={'media/avatars/150-2.jpg'}
          ></Avatar>
          <Tooltip title="Ant User" placement="top">
            <Avatar
              style={{
                backgroundColor: '#87d068',
              }}
              src={'media/avatars/150-26.jpg'}
            />
          </Tooltip>
          <Avatar
            style={{
              backgroundColor: '#1890ff',
            }}
            src={'media/avatars/150-25.jpg'}
          />
        </Avatar.Group>
      </div>

      <Divider />

      <div className="card_btns" style={{ marginTop: '1rem' }}>
        <Button
          type="primary"
          style={props.collapsedWidth !== 0 ? { marginRight: '.4rem' } : null}
          shape="round"
          size={props.collapsedWidth !== 0 ? 'medium' : 'small'}
        >
          View Details
        </Button>
        <Button
          type="primary"
          danger={true}
          style={props.collapsedWidth !== 0 ? { marginLeft: '.4rem' } : null}
          shape="round"
          size={props.collapsedWidth !== 0 ? 'medium' : 'small'}
        >
          Add to List
        </Button>
      </div>
    </Card>
  );
};
