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
            console.log('[useFolders] copyFolder response:', res);
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
            console.log('[useFolders] moveFolder response:', res);
            // Check if the response indicates success or if it created a new folder (copy behavior)
            if (res && res.id && res.id !== srcFolderId) {
              console.warn('[useFolders] WARNING: moveFolder returned a different folder ID. This suggests it copied instead of moved!', {
                originalId: srcFolderId,
                returnedId: res.id,
                response: res
              });
            }
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

  function createFolderPermission(folderId, entityId, entityType, permission) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.createFolderPermission(
          token,
          folderId,
          entityId,
          entityType,
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

  function updateFolder(folderId, name, description, image, isPublic) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.updateFolder(
          token,
          folderId,
          name,
          description,
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

  function deleteFolder(folderId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteFolder(
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
    updateFolder,
    deleteFolder,
  };
}

export default useFolders;
