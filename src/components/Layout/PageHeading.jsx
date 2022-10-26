import React from 'react';

function PageHeading(props) {
  return (
    <>
      <div
        style={{
          padding: '1.4rem 0 0.7rem 1rem',
          backgroundColor: '#f5f8fa',
        }}
      >
        <h2 style={{ fontWeight: 'bold', letterSpacing: '1px', fontSize: '1.4rem' }}>
          {props.heading}
        </h2>
      </div>
    </>
  );
}

export default PageHeading;
