import React from "react";
import { message } from "antd";
import JS2Py from "../remotepyjs/index";
import { useSelector } from "react-redux";

function useUploadGestureVideo() {
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { modelId } = useSelector((state) => state.model);

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Video uploaded!",
    });
  };

  const failure = () => {
    messageApi.open({
      type: "error",
      content: "Cannot upload video",
    });
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const uploadGestureVideoURL = (word, url) => {
    setLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addWordToVideoURLMapping(
        modelId,
        word,
        url,
        (res) => {
          console.log(res);
          setLoading(false);
          success();
        }
      );
    } catch (err) {
      console.log(err);
      setLoading(false);
      failure();
    }
  };

  const uploadVideo = (word, video_name, video) => {
    setLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.uploadGestureVideo(
        modelId,
        word,
        video_name,
        video,
        (res) => {
          console.log(res);
          setLoading(false);
          success();
        }
      );
    } catch (err) {
      console.log(err);
      setLoading(false);
      failure();
    }
  };

  return {
    normFile,
    uploadGestureVideoURL,
    uploadVideo,
    loading,
    contextHolder,
  };
}

export default useUploadGestureVideo;
