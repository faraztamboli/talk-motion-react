import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useNotifications() {
  const [token] = useLocalStorage("token");

  function getUserNotifications(unreadOnly = false, limit = 20) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserNotifications(
          token,
          unreadOnly,
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

  function markNotificationAsRead(notificationId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.markNotificationAsRead(
          token,
          notificationId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function markAllNotificationsAsRead() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.markAllNotificationsAsRead(
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

  function deleteNotification(notificationId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteNotification(
          token,
          notificationId,
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
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  };
}

export default useNotifications;

