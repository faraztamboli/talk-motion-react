import React from 'react';
import { Avatar, Image } from 'antd';

export default function UserMenuProfileItem(props) {
  return (
    <>
      <div
        className="menu-content d-flex align-items-center px-3"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <div className="symbol symbol-50px me-5" style={{ marginRight: '1rem' }}>
          {/* <img
            width={'50px'}
            style={{ borderRadius: '50%' }}
            src="media/avatars/150-2.jpg"
            alt="user_img"
          /> */}
          <Avatar
            src={<Image src="media/avatars/150-2.jpg" /* style={{ width: 32 }} */ />}
            size={
              props.size === 'small'
                ? { xs: 32, sm: 42, md: 45, lg: 48, xl: 50, xxl: 55 }
                : { xs: 42, sm: 72, md: 80, lg: 92, xl: 95, xxl: 100 }
            }
          />
        </div>
        <div className="d-flex flex-column">
          <div
            className="fw-border d-flex align-items-center fs-5"
            style={{ fontWeight: 'bolder', fontSize: 'larger', color: '#a1a5b7' }}
          >
            Max Smith
            <span
              className="badge badge-light-success fw-border fs-8 px-2 py-1 ms-2"
              style={{
                backgroundColor: '#e8fff3',
                color: '#50cd89',
                fontWeight: 'bold',
                fontSize: 'small',
                marginLeft: '.4rem ',
                padding: '3px 4px',
                verticalAlign: 'top',
                borderRadius: '10px',
              }}
            >
              pro
            </span>
          </div>
          <a
            href="/"
            className="fw-bold text-muted text-hover-primary fs-7"
            style={{ color: '#a1a5b7' }}
          >
            max@kt.com
          </a>
        </div>
      </div>
    </>
  );
}
