import React, { useState, useRef } from "react";

function useMediaStream() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [base64data, setBase64Data] = useState();

  const handleStartCaptureClick = React.useCallback(() => {
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current?.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = React.useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = React.useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleDownload = React.useCallback(() => {
    if (recordedChunks.length > 0) {
      console.log(recordedChunks);
      const blob = new Blob(recordedChunks, {
        type: "video/mp4",
      });

      // eslint-disable-next-line
      const retstring = toBase64String(blob).then((finalString) => {
        setBase64Data(finalString);
        console.log(finalString);
        return finalString;
      });

      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  function toBase64String(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      console.log(new Date());
    });
  }

  return {
    webcamRef,
    capturing,
    recordedChunks,
    base64data,
    handleStartCaptureClick,
    handleStopCaptureClick,
    handleDownload,
  };
}

export default useMediaStream;
