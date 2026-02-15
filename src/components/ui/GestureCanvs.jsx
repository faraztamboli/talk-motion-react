import React, { useEffect } from "react";
import Webcam from "react-webcam";

export const GestureCanvs = (props) => {
  const { webcamRef, canvasRef, isPageActive, setIsPageActive } = props;

  useEffect(() => {
    return () => {
      setIsPageActive(false); // to destroy the webcam when the component unmounts
    };
  }, []);

  return (
    <>
      {isPageActive ? (
        <>
          <Webcam 
            hidden 
            ref={webcamRef}
            audio={false}
            videoConstraints={{
              width: 512,
              height: 300,
              facingMode: "user"
            }}
          />
          <div 
            style={{ 
              position: 'relative', 
              backgroundColor: "black", 
              minHeight: '280px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginTop: 'var(--spacing-xs)'
            }} 
            className="converter-video-placeholder output_canvas block w-100p mb-4"
            role="img"
            aria-label="Live camera feed showing gesture recognition"
          >
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block', minHeight: '280px' }}
              aria-label="Gesture recognition canvas overlay"
            ></canvas>
          </div>
        </>
      ) : (
        <div 
          style={{ 
            position: 'relative', 
            backgroundColor: "black", 
            minHeight: '280px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginTop: 'var(--spacing-xs)'
          }} 
          className="converter-video-placeholder output_canvas block w-100p mb-4"
          role="img"
          aria-label="Camera view - ready to start gesture recognition"
        >
          <div 
            style={{ 
              textAlign: 'center', 
              color: '#fff', 
              opacity: 0.9,
              padding: 'var(--spacing-lg)'
            }}
            role="status"
            aria-live="polite"
          >
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              style={{ marginBottom: 'var(--spacing-md)', display: 'block', margin: '0 auto var(--spacing-md)' }}
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Click "Start" to begin</p>
            <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: '14px', opacity: 0.8 }}>
              Position yourself in front of the camera
            </p>
          </div>
        </div>
      )}
    </>
  );
};
