import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useDashboard() {
  const [token] = useLocalStorage("token");

  function getUserDashboardStats() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserDashboardStats(
          token,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getUserLearningProgress() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserLearningProgress(
          token,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getUserActiveClassrooms(limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserActiveClassrooms(
          token,
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

  function getUserRecentVideos(type = "created", limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserRecentVideos(
          token,
          type,
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

  function getCommunityStats() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getCommunityStats(
          token,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getFeaturedClassrooms(limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        // Check if the function exists before calling it
        if (!JS2Py.PythonFunctions.TalkMotionServer.getFeaturedClassrooms) {
          console.warn("getFeaturedClassrooms is not available on the server");
          resolve({ classrooms: [] });
          return;
        }
        JS2Py.PythonFunctions.TalkMotionServer.getFeaturedClassrooms(
          token,
          limit,
          function (res) {
            resolve(res || { classrooms: [] });
          }
        );
      } catch (err) {
        console.error("Error getting featured classrooms:", err);
        // Return empty result instead of rejecting to prevent UI errors
        resolve({ classrooms: [] });
      }
    });
  }

  function getPopularVideos(period = "week", limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        // Check if the function exists before calling it
        if (!JS2Py.PythonFunctions.TalkMotionServer.getPopularVideos) {
          console.warn("getPopularVideos is not available on the server");
          resolve({ videos: [] });
          return;
        }
        JS2Py.PythonFunctions.TalkMotionServer.getPopularVideos(
          token,
          period,
          limit,
          function (res) {
            resolve(res || { videos: [] });
          }
        );
      } catch (err) {
        console.error("Error getting popular videos:", err);
        // Return empty result instead of rejecting to prevent UI errors
        resolve({ videos: [] });
      }
    });
  }

  function getNewPublicClassrooms(limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getNewPublicClassrooms(
          token,
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

  return {
    getUserDashboardStats,
    getUserLearningProgress,
    getUserActiveClassrooms,
    getUserRecentVideos,
    getCommunityStats,
    getFeaturedClassrooms,
    getPopularVideos,
    getNewPublicClassrooms,
  };
}

export default useDashboard;

