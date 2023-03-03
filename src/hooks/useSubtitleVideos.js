import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useSubtitleVideos() {
  const [token] = useLocalStorage("token");

  function getVideoRecordings(searchText) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getVideoRecordings(
          token,
          searchText,
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

  return { getVideoRecordings };
}

export default useSubtitleVideos;
