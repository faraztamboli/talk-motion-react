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

  const uploadVideo = (word, video_name, video) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addWordToVideoURLMapping(
        word,
        video,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
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

  return { normFile, uploadVideo };
}

export default useUploadGestureVideo;
