import React from "react";

function VoiceToGestureVideo(props) {
  const { video, setVideo, count, setCount, videoSrc } = props;

  return (
    <video
      src={video && videoSrc(video)}
      style={!video ? { backgroundColor: "black" } : null}
      controls
      className="block w-100p mb-6"
      autoPlay
      muted
      onEnded={() => {
        if (count == video.length - 1) {
          setCount(0);
          setVideo(null);
          return;
        } else {
          setCount((prevCount) => prevCount + 1);
        }
      }}
    ></video>
  );
}

export default VoiceToGestureVideo;
