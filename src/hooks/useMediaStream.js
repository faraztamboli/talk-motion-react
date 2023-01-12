import React, { useState, useRef } from "react";
import useBase64String from "./useBase64String";

function useMediaStream() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [base64data, setBase64Data] = useState();
  const { getBase64 } = useBase64String();

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

      getBase64(blob)
        .then((finalString) => {
          setBase64Data(finalString);
          return finalString;
        })
        .catch((err) => console.log(err));

      setRecordedChunks([]);
    }
  }, [recordedChunks]);

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
