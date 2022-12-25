import React from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useModels() {
  const [publicModels, setPublicModels] = React.useState([]);
  const [userModels, setUserModels] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [publicLoading, setPublicLoading] = React.useState(true);
  const [userLoading, setUserLoading] = React.useState(true);
  const [token] = useLocalStorage("token");

  React.useEffect(() => {
    getUserModels();
    getPublicModels();
  }, [userModels.length, publicModels.length, loading]);

  function getPublicModels() {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getPublicModels(function (res) {
        if (res.constructor == Array) {
          setPublicModels(() => res);
          setPublicLoading(false);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  function getUserModels() {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(
        token,
        function (res) {
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
    publicModels,
    userModels,
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
