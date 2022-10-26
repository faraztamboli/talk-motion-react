import React from 'react';

function ServerError() {
  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2.3rem', color: '#1890ff' }}>Unable to connect to Server</h2>
        <p
          style={{
            fontSize: '1rem',
            letterSpacing: '1px',
            fontWeight: '500',
            color: 'hsl(210deg 8% 45%)',
          }}
        >
          Please check your internet connection or reload the page
        </p>
      </div>
    </>
  );
}

export default ServerError;
