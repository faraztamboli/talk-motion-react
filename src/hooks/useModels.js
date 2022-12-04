import React from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useModels() {
  const [publicModels, setPublicModels] = React.useState();
  const [userModels, setUserModels] = React.useState();
  const [loading, setLoading] = React.useState(true);
  const [token] = useLocalStorage("token");

  React.useEffect(() => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getPublicModels((res) => {
        setPublicModels(res);
        setLoading(false);
      });
    } catch (err) {
      console.log(err);
    }
  }, [loading]);

  React.useEffect(() => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(token, (res) => {
        setUserModels(res);
        setLoading(false);
      });
    } catch (err) {
      console.log(err);
    }
  }, [loading]);

  const createNewModel = (title, description) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.createModel(
        "",
        title,
        description,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const addNewTrainer = (modelid, username) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addTrainerToModel(
        modelid,
        username,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const deleteModel = (modelid) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.deleteModel(
        token,
        modelid,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const updateModel = (modelid, title, description, is_public) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.updateModel(
        modelid,
        title,
        description,
        is_public,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const cloneModel = (modelid) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.cloneModel(token, modelid, (res) =>
        console.log(res)
      );
    } catch (err) {
      console.log(err);
    }
  };

  const purchaseModel = (modelid) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.purchaseModel(
        token,
        modelid,
        (res) => console.log(res)
      );
    } catch (err) {
      console.log(res);
    }
  };

  return {
    publicModels,
    userModels,
    loading,
    createNewModel,
    addNewTrainer,
    deleteModel,
    updateModel,
    cloneModel,
    purchaseModel,
  };
}

export default useModels;
