import React from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useModels() {
  const [publicModels, setPublicModels] = React.useState([]);
  const [userModels, setUserModels] = React.useState([]);
  const [userCount, setUserCount] = React.useState(0);
  const [publicCount, setPublicCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [publicLoading, setPublicLoading] = React.useState(true);
  const [userLoading, setUserLoading] = React.useState(true);
  const [token] = useLocalStorage("token");

  React.useEffect(() => {
    getUserModels(1, 9);
    getPublicModels(1, 9);
  }, [userModels.length, publicModels.length, loading]);

  function getPublicModels(offset, end) {
    setPublicLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getPublicModels(
        offset,
        end,
        function (res) {
          setPublicCount(res[1][`count(*)`]);
          res = res[0];
          if (res.constructor == Array) {
            setPublicModels(() => res);
            setPublicLoading(false);
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function getUserModels(offset, end) {
    setUserLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(
        token,
        offset,
        end,
        function (res) {
          setUserCount(res[1][`count(*)`]);
          res = res[0];
          if (res.constructor == Array) {
            setUserModels(() => res);
            setUserLoading(false);
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function createNewModel(title, description) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.createModel(
        token,
        title,
        description,
        function (res) {
          console.log(res);
          setLoading(false);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function addNewTrainer(modelid, username) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addTrainerToModel(
        modelid,
        username,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function deleteModel(modelid) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.deleteModel(
        token,
        modelid,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function updateModel(modelid, title, description, is_public) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.updateModel(
        modelid,
        title,
        description,
        is_public,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function cloneModel(modelid) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.cloneModel(
        token,
        modelid,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function purchaseModel(modelid) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.purchaseModel(
        token,
        modelid,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  return {
    publicCount,
    publicModels,
    getPublicModels,
    userCount,
    userModels,
    getUserModels,
    loading,
    userLoading,
    publicLoading,
    createNewModel,
    addNewTrainer,
    deleteModel,
    updateModel,
    cloneModel,
    purchaseModel,
  };
}

export default useModels;
