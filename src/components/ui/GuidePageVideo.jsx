import React from 'react';

function GuidePageVideo(props) {
  return (
    <div
      style={
        props.lg !== true
          ? {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '0 4rem 0 0rem',
            }
          : {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              margin: '0 0rem 0 0rem',
            }
      }
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
  );
}

export default GuidePageVideo;
