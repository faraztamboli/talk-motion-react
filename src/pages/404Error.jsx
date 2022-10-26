import React from 'react';

function Error() {
  return (
    <>
      <div
        style={{
          width: '100%',
          minHeight: '660',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2.3rem', color: '#1890ff' }}>404 not Found</h2>
        <p
          style={{
            fontSize: '1rem',
            letterSpacing: '1px',
            fontWeight: '500',
            color: 'hsl(210deg 8% 45%)',
          }}
        >
          The page you are looking is not found on TalkMotion
        </p>
      </div>
    </>
  );
}

export default Error;
