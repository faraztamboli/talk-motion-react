import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useFolders() {
  const [token] = useLocalStorage("token");

  function saveFolder(name, description, parentId, image, isPublic) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.saveFolder(
          token,
          name,
          description,
          parentId,
          image,
          isPublic,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getChildFolders(parentId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getChildFolders(
          token,
          parentId,
          function (res) {
            // console.log(res);
            if (res.constructor == Array) resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function saveFolderContent(folderId, contentId, type, name) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.saveFolderContent(
          token,
          folderId,
          contentId,
          type,
          name,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getFolderContent(folderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getFolderContent(
          token,
          folderId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function copyFolder(srcFolderId, destFolderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.copyFolder(
          token,
          srcFolderId,
          destFolderId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function moveFolder(srcFolderId, destFolderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.moveFolder(
          token,
          srcFolderId,
          destFolderId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getFolderAndContentsAndPermissions(folderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getFolderAndContentsAndPermissions(
          token,
          folderId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function createFolderPermission(folderId, userId, permission) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.createFolderPermission(
          token,
          folderId,
          userId,
          permission,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getFolderPermissions(folderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getFolderPermissions(
          token,
          folderId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function deleteFolderPermission(folderPermissionId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteFolderPermission(
          token,
          folderPermissionId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function removeFolderContent(folderContentId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.removeFolderContent(
          token,
          folderContentId,
          function (res) {
            // console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  return {
    saveFolder,
    getChildFolders,
    saveFolderContent,
    getFolderContent,
    copyFolder,
    moveFolder,
    getFolderAndContentsAndPermissions,
    createFolderPermission,
    getFolderPermissions,
    deleteFolderPermission,
    removeFolderContent,
  };
}

export default useFolders;
