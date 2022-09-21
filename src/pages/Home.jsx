import React from 'react';
import JS2Py from '../remotepyjs';

export default function Home() {
  const handleClick = async () => {
    console.log('inside home', JS2Py);
  };
  return (
    <div>
      <h1>Home</h1>
      <button className="btn" onClick={handleClick}>
        click me
      </button>
    </div>
  );
}
