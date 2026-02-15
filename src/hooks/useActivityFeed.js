import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useActivityFeed() {
  const [token] = useLocalStorage("token");

  function getUserActivityFeed(limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserActivityFeed(
          token,
          limit,
          offset,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getCommunityActivityFeed(limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getCommunityActivityFeed(
          token,
          limit,
          offset,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getClassroomActivity(classroomId, limit = 20) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getClassroomActivity(
          token,
          classroomId,
          limit,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function markActivityAsRead(activityId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.markActivityAsRead(
          token,
          activityId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    getUserActivityFeed,
    getCommunityActivityFeed,
    getClassroomActivity,
    markActivityAsRead,
  };
}

export default useActivityFeed;

