import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useSubtitleVideos() {
  const [token] = useLocalStorage("token");

<<<<<<< HEAD
  function getVideoRecordings(searchText, offset, end) {
=======
  function getPublicVideoRecordings(searchText) {
>>>>>>> 504e0093ace3d5d70144a9c89c51faedf6abd6ec
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPublicVideoRecordings(
          token,
          searchText,
<<<<<<< HEAD
          offset,
          end,
=======
          0,
          100000,
>>>>>>> 504e0093ace3d5d70144a9c89c51faedf6abd6ec
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
