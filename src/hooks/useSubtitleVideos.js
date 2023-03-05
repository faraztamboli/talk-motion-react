import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useSubtitleVideos() {
  const [token] = useLocalStorage("token");

  function getPublicVideoRecordings(searchText) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPublicVideoRecordings(
          token,
          searchText,
          0,
          100000,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getMyVideoRecordings(searchText) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getVideoRecordingsICanUse(
          token,
          searchText,
          0,
          100000,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  return { getPublicVideoRecordings, getMyVideoRecordings };
}

export default useSubtitleVideos;
