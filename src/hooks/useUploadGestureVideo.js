import JS2Py from "../remotepyjs/index";

function useUploadGestureVideo() {
  const normFile = (e) => {
    console.log("Upload event:", e);

    if (Array.isArray(e)) {
      //   setVideo(e);
      return e;
    }
    // setVideo(e?.fileList);
    return e?.fileList;
  };

  const uploadGestureVideoURL = (word, url) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addWordToVideoURLMapping(
        word,
        url,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const uploadVideo = (word, video_name, video) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.uploadGestureVideo(
        word,
        video_name,
        video,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  return { normFile, uploadGestureVideoURL, uploadVideo };
}

export default useUploadGestureVideo;
