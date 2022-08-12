import React from 'react';
import { GestureCanvs } from './GestureCanvs';

export const GestureToVoice = () => {
  return (
    <div>
      <h2 className="mb-0">Train</h2>
      <p>Collect samples and train your model</p>
      <GestureCanvs />
    </div>
  );
};
