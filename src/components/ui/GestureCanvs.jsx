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
          <Webcam hidden ref={webcamRef} />
          <canvas
            ref={canvasRef}
            style={{ backgroundColor: "black" }}
            className="output_canvas block w-100p mb-6"
          ></canvas>
        </>
      ) : (
        <canvas
          style={{ backgroundColor: "black" }}
          className="output_canvas block w-100p mb-6"
        ></canvas>
      )}
    </>
  );
};
