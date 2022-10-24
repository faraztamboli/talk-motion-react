import { Button, Col, Row } from 'antd';
import React from 'react';

function GuidePage(props) {
  return (
    <>
      <Row
        style={{ minHeight: '100vh', backgroundColor: 'rgb(249 249 249)' }}
        className="guide-page"
      >
        <Col span={24}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: '1rem',
              marginRight: '1rem',
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
              Help
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
              Signup
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
              Login
            </Button>
          </div>
        </Col>
        <Col span={12} xs={24} lg={12}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '0 4rem 0 1rem',
              paddingLeft: '4rem',
            }}
          >
            <h2
              style={
                props.lg !== true
                  ? { fontSize: '3rem', fontWeight: '700', lineHeight: '3.516rem' }
                  : {
                      marginTop: '2rem',
                      fontSize: '2rem',
                      fontWeight: 700,
                      lineHeight: '2.891rem',
                    }
              }
            >
              Easy gesture to voice and voice to gesture converter.
            </h2>
            <video
              src="..."
              style={{ backgroundColor: 'black', width: '100%', height: '15.125rem' }}
            ></video>
          </div>
        </Col>
        <Col span={12} xs={24} lg={12}>
          <div style={props.lg === true ? { margin: '2rem 0 0 5rem' } : null}>
            <div
              className="con con-1"
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div className="number">
                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50px',
                    height: '50px',
                    border: '1px solid black',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    backgroundColor: 'white',
                  }}
                >
                  1
                </p>
              </div>
              <div
                className="content"
                style={{
                  marginLeft: '2rem',
                  paddingTop: '.4rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    lineHeight: '1.7rem',
                    display: 'inline-block',
                  }}
                >
                  Train the system to earn points
                </h2>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    width: '50%',
                    marginTop: '1.313rem',
                  }}
                >
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,
                  molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum
                </p>
              </div>
            </div>
            <div
              className="con con-1"
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}
            >
              <div className="number">
                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50px',
                    height: '50px',
                    border: '1px solid black',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    backgroundColor: 'white',
                  }}
                >
                  2
                </p>
              </div>
              <div className="content" style={{ marginLeft: '2rem', paddingTop: '.4rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.7rem' }}>
                  Convert your voice to gestures
                </h2>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    width: '50%',
                    marginTop: '1.313rem',
                  }}
                >
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,
                  molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum
                </p>
              </div>
            </div>
            <div
              className="con con-1"
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}
            >
              <div className="number">
                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50px',
                    height: '50px',
                    border: '1px solid black',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    backgroundColor: 'white',
                  }}
                >
                  3
                </p>
              </div>
              <div className="content" style={{ marginLeft: '2rem', paddingTop: '.4rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.7rem' }}>
                  Convert your gestures to voice
                </h2>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    width: '50%',
                    marginTop: '1.313rem',
                  }}
                >
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,
                  molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default GuidePage;
